// Outside light curve (0–100) based on local time.
// ~0 at night, peaks around noon.
export function outsideLightNow() {
  const h = new Date().getHours();
  const peak = 90;
  const val = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * peak); // sunrise ~6 → sunset ~18
  return Math.round(val);
}

// Recommended indoor light target (45–75) derived from outside light,
// with tiny per-plant tweaks. Keep targets modest for readability.
export function targetIndoorLightFor(outside, plantName = "") {
  let base = 60;
  if (outside >= 80) base = 55;
  else if (outside >= 60) base = 60;
  else if (outside >= 40) base = 65;
  else base = 70;

  if (/rosemary/i.test(plantName)) base -= 2; // bright lover but avoid overexpose indoors
  if (/fig/i.test(plantName)) base += 2;      // Ficus lyrata likes a touch more
<<<<<<< HEAD
<<<<<<< HEAD
  if (/snake|sansevieria/i.test(plantName)) base -= 3; // Snake plants do fine with less
  return base;
}
=======
  return Math.max(45, Math.min(75, base));
}
>>>>>>> 9cbefc4 (Merge smart-garden-frontend into client folder)
=======
  return Math.max(45, Math.min(75, base));
}
=======
  if (/snake|sansevieria/i.test(plantName)) base -= 3; // Snake plants do fine with less
  return base;
}
>>>>>>> 56df1a6 (chore: remove mock data and mockApi for production integration)
>>>>>>> aa9e4b2 (chore: remove mock data and mockApi for production integration)
