import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDto } from './customer.dto';
import { ProductDto } from './product.dto';

export class IssueCardRequestDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ApiProperty({ type: ProductDto })
  @ValidateNested()
  @Type(() => ProductDto)
  product!: ProductDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  forceError?: boolean;
}
