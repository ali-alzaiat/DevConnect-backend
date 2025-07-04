import { Module } from "@nestjs/common";
import { ArticalService } from "./artical.service";
import { ArticalController } from "./artical.controller";

@Module({
    controllers: [ArticalController],
    providers: [ArticalService],
})
export class ArticalModule {}