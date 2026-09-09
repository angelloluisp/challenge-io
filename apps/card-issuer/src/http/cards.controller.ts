import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IssueCardUseCase } from '../application/use-cases/issue-card.use-case';
import { GetCardRequestStatusUseCase } from '../application/use-cases/get-card-request-status.use-case';
import { IssueCardRequestDto } from './dto/issue-card-request.dto';
import { CardRequestStatusResponseDto, IssueCardResponseDto } from './dto/issue-card-response.dto';

@ApiTags('cards')
@Controller()
export class CardsController {
  constructor(
    private readonly issueCardUseCase: IssueCardUseCase,
    private readonly getCardRequestStatusUseCase: GetCardRequestStatusUseCase,
  ) {}

  @Post('cards/issue')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiResponse({ status: 202, type: IssueCardResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 409, description: 'Card already exists for this document number' })
  async issueCard(@Body() dto: IssueCardRequestDto): Promise<IssueCardResponseDto> {
    const result = await this.issueCardUseCase.execute({
      documentType: dto.customer.documentType,
      documentNumber: dto.customer.documentNumber,
      fullName: dto.customer.fullName,
      age: dto.customer.age,
      email: dto.customer.email,
      cardType: dto.product.type,
      currency: dto.product.currency,
      forceError: dto.forceError ?? false,
    });
    return result;
  }

  @Get('card-requests/:requestId')
  @ApiResponse({ status: 200, type: CardRequestStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Card request not found' })
  async getCardRequestStatus(
    @Param('requestId') requestId: string,
  ): Promise<CardRequestStatusResponseDto> {
    return this.getCardRequestStatusUseCase.execute(requestId);
  }
}
