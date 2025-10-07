export class CreateNotificationDto {
  /**
   * The user ID this notification belongs to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * The message content of the notification
   * @example "Your plant needs water!"
   */
  message: string;

  /**
   * The type/category of notification
   * @example "watering_needed"
   */
  type: string;

  /**
   * ID of the related entity (e.g., plant ID)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  relatedEntityId?: string;

  /**
   * Type of the related entity
   * @example "plant"
   */
  relatedEntityType?: string;
}