import { ApiProperty } from "@nestjs/swagger";
import { TaskStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class Task {
    @IsNumber()
    @ApiProperty()
    id: number;

    @IsString()
    @ApiProperty()
    title: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    description?: string;

    @Type(() => Date)
    @IsDate()
    @ApiProperty()
    dueDate: Date;

    @ApiProperty()
    status: TaskStatus;
}