import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CardType, Currency } from '@card-domain/index';

export class ProductDto {
  @ApiProperty({ enum: CardType, example: CardType.VISA })
  @IsIn(Object.values(CardType))
  type!: CardType;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @IsIn(Object.values(Currency))
  currency!: Currency;
}
