export class SensorReadingDto {
  /**
   * The reading value from the sensor
   * @example 42.5
   */
  value: number;

  /**
   * Optional units of measurement
   * @example "%"
   */
  unit?: string;

  /**
   * Optional additional metadata for the reading
   */
  metadata?: Record<string, any>;
}