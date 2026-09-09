import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@card-domain/index';

export class CustomerDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.DNI })
  @IsIn(Object.values(DocumentType))
  documentType!: DocumentType;

  @ApiProperty({ example: '11654321' })
  @Matches(/^\d{8}$/, { message: 'documentNumber must be 8 numeric digits' })
  documentNumber!: string;

  @ApiProperty({ example: 'Jose Perez' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(18, { message: 'age must indicate the customer is an adult' })
  age!: number;

  @ApiProperty({ example: 'joseperez@example.com' })
  @IsEmail()
  email!: string;
}
