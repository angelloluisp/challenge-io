import { ApiProperty } from '@nestjs/swagger';
import { CardRequestStatus } from '@card-domain/index';

export class IssueCardResponseDto {
  @ApiProperty({ example: 'b3f1c2f0-9c1a-4b1a-9d1a-000000000000' })
  requestId!: string;

  @ApiProperty({ enum: CardRequestStatus, example: CardRequestStatus.PENDING })
  status!: CardRequestStatus;
}

export class CardRequestStatusResponseDto {
  @ApiProperty()
  requestId!: string;

  @ApiProperty({ enum: CardRequestStatus })
  status!: CardRequestStatus;

  @ApiProperty({ nullable: true, example: '**** **** **** 1234' })
  maskedPan?: string;

  @ApiProperty({ nullable: true, example: '09/30' })
  expirationDate?: string;
}
