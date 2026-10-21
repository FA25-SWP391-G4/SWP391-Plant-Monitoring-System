import os
import sys
import time
import io

# Ensure UTF-8 output encoding for all platforms
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Resolve local paths relative to this script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import cv2
import numpy as np
from PIL import Image
import onnxruntime as ort
from enhanced_leaf_extractor import extract_tight_leaf

MODELS_DIR = os.path.join(CURRENT_DIR, "models")
U2NETP_MODEL = os.path.join(MODELS_DIR, "u2netp.onnx")

DEFAULT_MODEL = os.path.join(MODELS_DIR, "mobilenet_v3_large_14class_320x320.onnx")
ACCURATE_MODEL = os.path.join(MODELS_DIR, "resnet18_14class_320x320.onnx")

CLASS_NAMES_14 = [
    'Aloe_Fungal_Infection', 'Aloe_Healthy', 'Aloe_Sunburn',
    'Cactus_Dactylopius_Opuntia', 'Cactus_Healthy',
    'Money_Plant_Bacterial_wilt_disease', 'Money_Plant_Healthy', 'Money_Plant_Manganese_Toxicity',
    'Snake_Plant_Anthracnose', 'Snake_Plant_Healthy', 'Snake_Plant_Leaf_Withering',
    'Spider_Plant_Fungal_leaf_spot', 'Spider_Plant_Healthy', 'Spider_Plant_Leaf_Tip_Necrosis'
]

SPECIES_LIST = ['Aloe', 'Cactus', 'Money Plant', 'Snake Plant', 'Spider Plant']

CONDITION_INFO = {
    'Healthy': {
        'description': 'Plant tissue shows normal cellular integrity and chlorophyll density with no visible fungal or bacterial lesions.',
        'treatment': 'Maintain current watering schedule, adequate indirect lighting, and proper pot drainage.'
    },
    'Fungal Infection': {
        'description': 'Leaf shows circular or irregular fungal spots, rust rings, or dark lesions caused by pathogenic spores.',
        'treatment': 'Isolate plant. Prune heavily affected leaves using sterilized shears. Reduce overhead misting and apply an organic copper-based fungicide.'
    },
    'Sunburn': {
        'description': 'Bleached, brown, or dry papery patches resulting from excessive direct ultraviolet radiation exposure.',
        'treatment': 'Move plant away from intense midday sun to filtered/indirect light. Increase ambient humidity slightly.'
    },
    'Dactylopius Opuntia': {
        'description': 'Cochineal scale insect infestation creating powdery white cottony waxy tufts that sap plant fluids.',
        'treatment': 'Dab infested patches with a cotton swab soaked in 70% isopropyl alcohol. Spray with horticultural neem oil spray.'
    },
    'Bacterial wilt disease': {
        'description': 'Vascular bacterial blockage leading to rapid leaf yellowing, limp petioles, and water-soaked stems.',
        'treatment': 'Remove wilting stems immediately. Avoid overwatering and waterlogged soil. Disinfect plant containers.'
    },
    'Manganese Toxicity': {
        'description': 'Brown necrotic speckles, chlorotic leaf margins, and stunted growth often triggered by acidic soil pH (< 5.5).',
        'treatment': 'Flush potting soil with clean water. Check and adjust soil pH toward neutral (6.2 - 6.8). Reduce high-manganese fertilizers.'
    },
    'Anthracnose': {
        'description': 'Sunken tan-to-brown lesions with darker concentric rings, common in warm and excessively humid conditions.',
        'treatment': 'Prune affected leaf tips. Improve air circulation around foliage and keep leaves dry during watering.'
    },
    'Leaf Withering': {
        'description': 'Wrinkled, curling, desiccation of succulent foliage caused by prolonged underwatering or root desiccation.',
        'treatment': 'Perform a deep soak watering. Ensure potting mix absorbs water rather than letting it bypass dry root balls.'
    },
    'Fungal leaf spot': {
        'description': 'Scattered reddish-brown necrotic spots with chlorotic yellow halos on Spider plant ribbons.',
        'treatment': 'Clip spotted ribbons near base. Avoid wetting foliage when watering. Ensure bright indirect lighting.'
    },
    'Leaf Tip Necrosis': {
        'description': 'Browning and crispy drying of leaf tips caused by fluoride/chlorine in tap water or severe low humidity.',
        'treatment': 'Switch to filtered, distilled, or rainwater. Flush soil to clear fertilizer salt accumulation.'
    }
}

def get_species(cls_name: str) -> str:
    p = cls_name.split('_')
    return f"{p[0]} {p[1]}" if p[0] in ['Money', 'Snake', 'Spider'] else p[0]

def get_clean_condition(cls_name: str) -> str:
    p = cls_name.split('_')
    if p[0] in ['Money', 'Snake', 'Spider']:
        return " ".join(p[2:])
    return " ".join(p[1:])

class ProductionPlantPipeline:
    def __init__(self, model_variant: str = "mobilenetv3", temperature: float = 1.0):
        """
        Production End-to-End Plant Disease Diagnostic Engine on CPU:
        - Stage 1: Ultra-fast Salient Object Detection (u2netp FP32, ~4.5 MB)
        - Stage 1.5: Anti-aliased leaf isolation & Gaussian edge feathering into black (0,0,0)
        - Stage 1.75: Aspect-ratio preserving letterbox padding to 320x320
        - Stage 2: 14-Class Diagnosis via ONNX Runtime on CPU at 320x320
        - Stage 3: Entropy & Quality Gating for Real-World Out-of-Distribution Calibration
        
        Args:
            model_variant: 'mobilenetv3' (default, 5.8ms CPU, well-calibrated) or 'resnet18' (30ms CPU)
            temperature: Softmax temperature calibration factor (default 1.0)
        """
        self.model_variant = model_variant.lower()
        self.temperature = float(temperature)
        
        # 1. Stage 1: Ultra-lightweight u2netp ONNX Segmentation Session (Zero-PyTorch, ~4.5MB)
        if not os.path.exists(U2NETP_MODEL):
            raise FileNotFoundError(f"u2netp model checkpoint not found: {U2NETP_MODEL}")
            
        seg_opts = ort.SessionOptions()
        seg_opts.intra_op_num_threads = 1
        seg_opts.inter_op_num_threads = 1
        seg_opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        seg_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.seg_session = ort.InferenceSession(U2NETP_MODEL, seg_opts, providers=['CPUExecutionProvider'])
        self.seg_input_name = self.seg_session.get_inputs()[0].name
        
        # 2. Stage 2: ONNX Classification Session
        if self.model_variant in ["mobilenetv3", "mobilenet", "mbv3", "fast"]:
            model_path = DEFAULT_MODEL
        else:
            model_path = ACCURATE_MODEL
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model checkpoint not found: {model_path}")
            
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.cls_session = ort.InferenceSession(model_path, opts, providers=['CPUExecutionProvider'])
        self.input_name = self.cls_session.get_inputs()[0].name
        
        self.class_names = CLASS_NAMES_14
        self.max_entropy = np.log(len(self.class_names)) # ln(14) ≈ 2.639

    def _segment_u2netp(self, img_bgr: np.ndarray) -> np.ndarray:
        h, w = img_bgr.shape[:2]
        resized_bgr = cv2.resize(img_bgr, (320, 320), interpolation=cv2.INTER_LINEAR)
        resized_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)
        img_norm = (resized_rgb.astype(np.float32) / 255.0 - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        tensor = np.transpose(img_norm, (2, 0, 1))[np.newaxis, ...].astype(np.float32)
        
        outputs = self.seg_session.run(None, {self.seg_input_name: tensor})
        d0 = outputs[0][0, 0]
        
        d_min, d_max = float(d0.min()), float(d0.max())
        pred = (d0 - d_min) / (d_max - d_min + 1e-8)
        mask_320 = (pred * 255.0).astype(np.uint8)
        return cv2.resize(mask_320, (w, h), interpolation=cv2.INTER_LINEAR)

    def _preprocess(self, tight_leaf_bgr: np.ndarray, target_size: int = 320) -> np.ndarray:
        """
        Letterbox aspect-ratio preserving preprocessing:
        Scales the leaf so its largest dimension is int(target_size * 0.92),
        then centers it on a pure black (target_size, target_size, 3) canvas.
        This preserves the organic geometric shape (aspect ratio) of the leaf.
        """
        h, w = tight_leaf_bgr.shape[:2]
        max_side = int(target_size * 0.92)
        scale = max_side / max(h, w)
        nw = max(1, int(w * scale))
        nh = max(1, int(h * scale))
        
        resized_leaf = cv2.resize(tight_leaf_bgr, (nw, nh), interpolation=cv2.INTER_CUBIC)
        canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
        
        y_off = (target_size - nh) // 2
        x_off = (target_size - nw) // 2
        canvas[y_off:y_off+nh, x_off:x_off+nw] = resized_leaf
        
        canvas_rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
        img_np = canvas_rgb.astype(np.float32) / 255.0
        img_np = (img_np - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        tensor = np.transpose(img_np, (2, 0, 1))[np.newaxis, ...].astype(np.float32)
        return tensor

    def predict(self, image_input, use_tta: bool = False) -> dict:
        """
        Run end-to-end diagnosis on a file path, PIL Image, or numpy BGR array.
        
        Args:
            image_input: Path string, PIL Image, or numpy ndarray (BGR).
            use_tta: If True, performs Test-Time Augmentation (original + horizontal flip)
                     to stabilize predictions against lighting glints (adds ~6ms on CPU).
        
        Returns:
            Structured diagnostic report dictionary.
        """
        t0 = time.perf_counter()
        
        # 1. Load image
        if isinstance(image_input, str):
            img_bgr = cv2.imread(image_input)
            if img_bgr is None:
                raise ValueError(f"Cannot load image from: {image_input}")
        elif isinstance(image_input, Image.Image):
            img_bgr = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        elif isinstance(image_input, np.ndarray):
            img_bgr = image_input.copy()
        else:
            raise TypeError("Unsupported image format. Provide file path, PIL.Image, or numpy ndarray.")
            
        h_orig, w_orig = img_bgr.shape[:2]
        
        # 2. Pre-downscale large images to 512px max for fast segmentation
        if max(h_orig, w_orig) > 512:
            scale = 512.0 / max(h_orig, w_orig)
            img_downscaled = cv2.resize(img_bgr, (int(w_orig * scale), int(h_orig * scale)))
        else:
            img_downscaled = img_bgr.copy()
            
        t_prep = time.perf_counter()
        
        # 3. Stage 1: Fast u2netp Mask (Pure ONNX, Zero-PyTorch)
        seg_mask = self._segment_u2netp(img_downscaled)
        t_seg = time.perf_counter()
        
        # 4. Stage 1.5: Anti-aliased Soft Leaf Extraction
        tight_leaf, clean_mask = extract_tight_leaf(img_downscaled, seg_mask)
        t_isolate = time.perf_counter()
        
        # 5. Quality Pre-flight Gating: Check if a valid leaf was found
        mask_pixel_count = cv2.countNonZero(clean_mask)
        mask_area_ratio = mask_pixel_count / (clean_mask.shape[0] * clean_mask.shape[1] + 1e-6)
        
        if mask_area_ratio < 0.015 or mask_pixel_count < 800:
            total_ms = (time.perf_counter() - t0) * 1000
            return {
                'status': 'REJECTED_NO_LEAF',
                'verdict': 'UNCERTAIN',
                'predicted_class': 'Unknown',
                'predicted_species': 'Unknown',
                'predicted_condition': 'No clear leaf detected',
                'confidence': 0.0,
                'normalized_entropy': 1.0,
                'shannon_entropy': float(self.max_entropy),
                'top3_predictions': [],
                'species_probabilities': {},
                'user_guidance': '⚠️ No plant leaf could be clearly isolated. Please hold your camera closer to a single leaf against a plain or contrasting background.',
                'treatment_recommendation': None,
                'timing_breakdown_ms': {
                    'segmentation': round((t_seg - t_prep) * 1000, 1),
                    'isolation_smoothing': round((t_isolate - t_seg) * 1000, 1),
                    'classification': 0.0,
                    'total_latency': round(total_ms, 1)
                },
                'processed_leaf_bgr': tight_leaf,
                'segmentation_mask': clean_mask
            }
            
        # 6. Stage 2: 320x320 ONNX Classification
        tensor = self._preprocess(tight_leaf)
        logits = self.cls_session.run(None, {self.input_name: tensor})[0][0]
        
        # Optional Test-Time Augmentation (Horizontal Flip)
        if use_tta:
            tight_leaf_flip = cv2.flip(tight_leaf, 1)
            tensor_flip = self._preprocess(tight_leaf_flip)
            logits_flip = self.cls_session.run(None, {self.input_name: tensor_flip})[0][0]
            logits = (logits + logits_flip) / 2.0
            
        # Softmax with optional temperature scaling
        scaled_logits = logits / max(1e-4, self.temperature)
        exp_l = np.exp(scaled_logits - np.max(scaled_logits))
        probs = exp_l / np.sum(exp_l)
        
        # Metrics: Entropy & Margins
        eps = 1e-12
        shannon_entropy = -float(np.sum(probs * np.log(probs + eps)))
        norm_entropy = float(shannon_entropy / self.max_entropy)
        
        sorted_indices = np.argsort(probs)[::-1]
        top_idx = int(sorted_indices[0])
        top_class = self.class_names[top_idx]
        top_prob = float(probs[top_idx])
        top2_prob = float(probs[sorted_indices[1]])
        margin = top_prob - top2_prob
        
        t_cls = time.perf_counter()
        
        # 7. Species-Level Aggregation
        species_probs = {s: 0.0 for s in SPECIES_LIST}
        for i, cls in enumerate(self.class_names):
            sp = get_species(cls)
            if sp in species_probs:
                species_probs[sp] += float(probs[i])
                
        sorted_species = sorted(species_probs.items(), key=lambda x: x[1], reverse=True)
        top_species, top_species_prob = sorted_species[0]
        
        # Species entropy
        sp_vals = np.array(list(species_probs.values()))
        species_entropy = -float(np.sum(sp_vals * np.log(sp_vals + eps)))
        
        # Top-3 Predictions
        top3 = [
            {
                'class': self.class_names[i],
                'species': get_species(self.class_names[i]),
                'condition': get_clean_condition(self.class_names[i]),
                'confidence': float(probs[i])
            }
            for i in sorted_indices[:3]
        ]
        
        # 8. Calibration & Uncertainty Verdict Gating
        clean_cond = get_clean_condition(top_class)
        info = CONDITION_INFO.get(clean_cond, {
            'description': f'Plant condition identified as {clean_cond}.',
            'treatment': 'Consult local plant care guidelines.'
        })
        
        if norm_entropy <= 0.48 and top_prob >= 0.52:
            verdict = "CONFIDENT"
            status = "DIAGNOSIS_HIGH_CONFIDENCE"
            guidance = f"✅ Confident diagnosis: {top_species} with {clean_cond} ({top_prob*100:.1f}% confidence)."
        elif norm_entropy <= 0.62 and top_prob >= 0.38:
            verdict = "MODERATE"
            status = "DIAGNOSIS_MODERATE_CONFIDENCE"
            guidance = f"ℹ️ Moderate confidence diagnosis ({top_prob*100:.1f}%). Symptoms partially resemble {top3[1]['condition']} ({top3[1]['confidence']*100:.1f}%)."
        else:
            verdict = "UNCERTAIN"
            status = "DIAGNOSIS_UNCERTAIN"
            guidance = f"⚠️ High diagnostic uncertainty (Entropy: {norm_entropy:.2f}, Conf: {top_prob*100:.1f}%). Leaf symptoms are ambiguous or background lighting is uneven. Please frame a single leaf closer against a plain background."
            
        total_ms = (t_cls - t0) * 1000
        seg_ms = (t_seg - t_prep) * 1000
        isolate_ms = (t_isolate - t_seg) * 1000
        cls_ms = (t_cls - t_isolate) * 1000
        
        return {
            'status': status,
            'verdict': verdict,
            'predicted_class': top_class,
            'predicted_species': top_species,
            'predicted_condition': clean_cond,
            'confidence': top_prob,
            'confidence_margin': round(margin, 4),
            'shannon_entropy': round(shannon_entropy, 4),
            'normalized_entropy': round(norm_entropy, 4),
            'species_confidence': round(top_species_prob, 4),
            'species_entropy': round(species_entropy, 4),
            'top3_predictions': top3,
            'species_probabilities': {k: round(v, 4) for k, v in species_probs.items()},
            'user_guidance': guidance,
            'condition_details': info['description'],
            'treatment_recommendation': info['treatment'],
            'timing_breakdown_ms': {
                'segmentation': round(seg_ms, 1),
                'isolation_smoothing': round(isolate_ms, 1),
                'classification': round(cls_ms, 1),
                'total_latency': round(total_ms, 1)
            },
            'processed_leaf_bgr': tight_leaf,
            'segmentation_mask': clean_mask
        }

if __name__ == "__main__":
    test_img = sys.argv[1] if len(sys.argv) > 1 else None
    pipeline = ProductionPlantPipeline(model_variant="mobilenetv3")
    
    if test_img and os.path.exists(test_img):
        print(f"\nAnalyzing: {test_img}")
        res = pipeline.predict(test_img, use_tta=True)
        print(f"Status:             {res['status']} ({res['verdict']})")
        print(f"Predicted Class:    {res['predicted_class']}")
        print(f"Species:            {res['predicted_species']} ({res['species_confidence']*100:.1f}%)")
        print(f"Condition:          {res['predicted_condition']} ({res['confidence']*100:.1f}%)")
        print(f"Entropy:            {res['shannon_entropy']} (Norm: {res['normalized_entropy']})")
        print(f"Latency:            {res['timing_breakdown_ms']['total_latency']} ms")
        print(f"Guidance:           {res['user_guidance']}")
        if res['treatment_recommendation']:
            print(f"Treatment:          {res['treatment_recommendation']}")
    else:
        sample_path = os.path.join(CURRENT_DIR, "sample_images", "money_plant_manganese_toxicity.jpg")
        if os.path.exists(sample_path):
            print(f"Running self-test on sample: {sample_path}")
            res = pipeline.predict(sample_path)
            print(f"Diagnosis: {res['predicted_class']} ({res['confidence']*100:.1f}%) | Latency: {res['timing_breakdown_ms']['total_latency']} ms")
        else:
            print("Provide an image path to predict: python pipeline.py <path_to_image>")
