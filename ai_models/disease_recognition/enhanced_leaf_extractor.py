import cv2
import numpy as np

def extract_tight_leaf(img_bgr, seg_mask, feather_kernel=(7, 7), sigma=2.0):
    """
    Enhanced Leaf Isolation & Background Removal Algorithm with Anti-Aliased Soft Edge Feathering:
    1. Soft threshold to capture organic leaf boundaries from u2netp.
    2. Morphological closing to fill leaf interior and eliminate sawtooth fringes.
    3. Plant color gating (HSV) at contour-level (preserves leaf textures without clipping).
    4. Polygon contour smoothing (eliminates stair-step pixel edges).
    5. Gaussian edge feathering & soft alpha blending into pure black (0,0,0).
    """
    h_orig, w_orig = img_bgr.shape[:2]
    
    # 1. Soft threshold
    _, binary_mask = cv2.threshold(seg_mask, 100, 255, cv2.THRESH_BINARY)
    
    # 2. Morphological smoothing: close holes and smooth ragged boundaries
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel_close)
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel_open)
    
    # 3. Find primary plant contours
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return img_bgr, binary_mask
        
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    max_area = cv2.contourArea(contours[0])
    
    clean_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
    significant_pts = []
    
    # HSV plant color verification: ensure contour contains genuine plant tissue
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    mask_foliage = cv2.inRange(hsv, np.array([12, 25, 20]), np.array([95, 255, 255]))
    mask_necrotic = cv2.inRange(hsv, np.array([0, 25, 20]), np.array([15, 255, 200])) | cv2.inRange(hsv, np.array([160, 25, 20]), np.array([180, 255, 200]))
    plant_color_mask = mask_foliage | mask_necrotic
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area >= 0.05 * max_area:
            # Check plant color ratio inside contour
            c_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
            cv2.drawContours(c_mask, [cnt], -1, 255, thickness=cv2.FILLED)
            plant_pixels = cv2.countNonZero(cv2.bitwise_and(c_mask, plant_color_mask))
            total_contour_pixels = cv2.countNonZero(c_mask)
            
            # If contour is at least 15% plant color, keep entire smooth contour
            if plant_pixels / (total_contour_pixels + 1e-5) >= 0.15:
                epsilon = 0.002 * cv2.arcLength(cnt, True)
                smooth_cnt = cv2.approxPolyDP(cnt, epsilon, True)
                cv2.drawContours(clean_mask, [smooth_cnt], -1, 255, thickness=cv2.FILLED)
                significant_pts.extend(smooth_cnt.reshape(-1, 2).tolist())
                
    if not significant_pts:
        # No contour contains plant-like colors (e.g. blank image or non-plant object)
        return np.zeros_like(img_bgr), clean_mask
    else:
        pts_arr = np.array(significant_pts)
        x, y, w, h = cv2.boundingRect(pts_arr)
        
    # Bounding box with 5% margin
    pad_x = int(w * 0.05)
    pad_y = int(h * 0.05)
    x0 = max(0, x - pad_x)
    y0 = max(0, y - pad_y)
    x1 = min(w_orig, x + w + pad_x)
    y1 = min(h_orig, y + h + pad_y)
    
    # 4. Anti-aliased Gaussian edge feathering into pure black
    mask_float = clean_mask.astype(np.float32) / 255.0
    alpha = cv2.GaussianBlur(mask_float, feather_kernel, sigma)
    alpha_3c = np.repeat(alpha[:, :, np.newaxis], 3, axis=2)
    
    # Soft alpha blend into pure black
    smooth_masked = (img_bgr.astype(np.float32) * alpha_3c).astype(np.uint8)
    tight_crop = smooth_masked[y0:y1, x0:x1]
    
    return tight_crop, clean_mask
