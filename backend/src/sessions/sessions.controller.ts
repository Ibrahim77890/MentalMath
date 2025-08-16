import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AllowedRoles } from '@/config/auth/public.decorator';
import { UserRole } from '@/users/entities/user.entity';
import { JwtAuthGuard } from '@/config/auth/jwt-auth.guard';
import { RolesGuard } from '@/config/auth/role.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @AllowedRoles(UserRole.TEACHER, UserRole.GUEST, UserRole.USER)
  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @Request() req) {
    return this.sessionsService.create(createSessionDto, req.user);
  }

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  @Get('current-session-question/:id')
  async findOneUserQuestionPopulated(@Param('id') id: string) {
    return await this.sessionsService.findOneUserQuestionPopulated(id);
  }

  @Post('answer-current-session-question')
  async postCurrentQuestionAnswer(
    @Body() body: { sessionId: string; response: string; timeTaken: number },
    @Request() req,
  ) {
    return await this.sessionsService.postCurrentQuestionAnswer(
      body.sessionId,
      { response: body.response, timeTaken: body.timeTaken },
      req.user,
    );
  }
}
