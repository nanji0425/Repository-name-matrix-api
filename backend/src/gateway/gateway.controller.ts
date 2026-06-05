import {
  Controller, Post, Get, Req, Res, Body, Headers,
  HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@ApiTags('OpenAI Compatible Gateway')
@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);
  constructor(private gatewayService: GatewayService) {}

  @Post('v1/chat/completions')
  @ApiOperation({ summary: 'Chat completions (OpenAI compatible)' })
  async chatCompletions(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.gatewayService.handleRequest(req, res, 'chat/completions');
  }

  @Post('v1/embeddings')
  @ApiOperation({ summary: 'Create embeddings (OpenAI compatible)' })
  async embeddings(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.gatewayService.handleRequest(req, res, 'embeddings');
  }

  @Post('v1/images/generations')
  @ApiOperation({ summary: 'Generate images (OpenAI compatible)' })
  async images(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.gatewayService.handleRequest(req, res, 'images/generations');
  }

  @Post('v1/audio/transcriptions')
  @ApiOperation({ summary: 'Audio transcriptions (OpenAI compatible)' })
  async transcriptions(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.gatewayService.handleRequest(req, res, 'audio/transcriptions');
  }

  @Get('v1/models')
  @ApiOperation({ summary: 'List available models (OpenAI compatible)' })
  async listModels() {
    return this.gatewayService.listModels();
  }
}
