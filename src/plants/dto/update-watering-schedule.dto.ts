import { PartialType } from '@nestjs/swagger';
import { CreateWateringScheduleDto } from './create-watering-schedule.dto';

export class UpdateWateringScheduleDto extends PartialType(CreateWateringScheduleDto) {}