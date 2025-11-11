import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'GrapeTrack API',
      version: '1.0.0',
    };
  }

  @Get('db')
  checkDatabase() {
    // TODO: Add actual database connection check when DB is set up
    return {
      status: 'ok',
      database: 'PostgreSQL',
      message: 'Database connection check not yet implemented',
    };
  }
}
