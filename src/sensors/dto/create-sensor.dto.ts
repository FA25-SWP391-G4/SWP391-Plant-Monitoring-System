export class CreateSensorDto {
  /**
   * The type of sensor (soil_moisture, temperature, humidity, light)
   * @example "soil_moisture"
   */
  type: string;

  /**
   * The ID of the plant this sensor is attached to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  plantId: string;

  /**
   * The physical location of the sensor (e.g., "pot", "grow bed")
   * @example "pot"
   */
  location?: string;

  /**
   * Optional model information for the sensor
   * @example "DHT22"
   */
  model?: string;
}