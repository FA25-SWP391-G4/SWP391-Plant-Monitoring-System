import os
import sys
import time
from pipeline import ProductionPlantPipeline

def print_result(path, res):
    print("\n" + "=" * 75)
    print(f" DIAGNOSTIC REPORT: {os.path.basename(path)}")
    print("=" * 75)
    
    verdict = res['verdict']
    icon = "✅" if verdict == "CONFIDENT" else ("ℹ️" if verdict == "MODERATE" else "⚠️")
    
    print(f"Overall Status:        {icon} {res['status']} ({verdict})")
    print(f"Identified Species:    {res['predicted_species']} ({res['species_confidence']*100:.1f}% confidence)")
    print(f"Identified Condition:  {res['predicted_condition']} ({res['confidence']*100:.1f}% confidence)")
    print(f"Full Class Label:      {res['predicted_class']}")
    print(f"Shannon Entropy:       {res['shannon_entropy']} (Normalized: {res['normalized_entropy']})")
    print(f"Confidence Margin:     {res['confidence_margin']*100:.1f}% (Gap to runner-up)")
    print("-" * 75)
    print("TOP-3 CANDIDATES:")
    for rank, c in enumerate(res['top3_predictions'], 1):
        print(f"  {rank}. {c['species']} - {c['condition']:<28} ({c['confidence']*100:.1f}%)")
    print("-" * 75)
    print("LATENCY BREAKDOWN (CPU):")
    t = res['timing_breakdown_ms']
    print(f"  Stage 1 (u2netp Segmentation):  {t['segmentation']} ms")
    print(f"  Stage 1.5 (Feathering & Norm):  {t['isolation_smoothing']} ms")
    print(f"  Stage 2 (MobileNetV3 ONNX):     {t['classification']} ms")
    print(f"  TOTAL END-TO-END LATENCY:       {t['total_latency']} ms")
    print("-" * 75)
    print(f"USER GUIDANCE:         {res['user_guidance']}")
    if res['treatment_recommendation']:
        print(f"TREATMENT ADVICE:      {res['treatment_recommendation']}")
    print("=" * 75 + "\n")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python demo.py <path_to_image>")
        print("  python demo.py <path_to_folder>")
        print("\nRunning demonstration on bundled sample_images/ ...")
        target = os.path.join(os.path.dirname(__file__), "sample_images")
    else:
        target = sys.argv[1]
        
    print("Initializing Production Plant Diagnostic Pipeline (MobileNetV3-Large)...")
    pipeline = ProductionPlantPipeline(model_variant="mobilenetv3")
    
    if os.path.isdir(target):
        files = [os.path.join(target, f) for f in sorted(os.listdir(target)) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not files:
            print(f"No image files found in directory: {target}")
            return
        print(f"Found {len(files)} image(s) to diagnose.")
        for f in files:
            res = pipeline.predict(f, use_tta=True)
            print_result(f, res)
    elif os.path.isfile(target):
        res = pipeline.predict(target, use_tta=True)
        print_result(target, res)
    else:
        print(f"Error: Target path does not exist: {target}")

if __name__ == "__main__":
    main()
