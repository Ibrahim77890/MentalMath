import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from './entities/session.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), forwardRef(() => UsersModule)],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService, TypeOrmModule.forFeature([Session])],
})
export class SessionsModule {}
