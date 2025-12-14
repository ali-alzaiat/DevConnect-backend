import { ApiProperty } from "@nestjs/swagger";
import { Tag } from "@prisma/client";
import { IsArray, IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export default class SnippetResponseDTO {
    @IsNumber()
    @ApiProperty()
    id: number;

    @IsString()
    @ApiProperty()
    name: string;

    @IsArray()
    @ApiProperty()
    tags: Tag[];

    @IsString()
    @ApiProperty()
    code: string;

    @IsString()
    @ApiProperty()
    @IsOptional()
    description?: string | null;

    @IsDate()
    @ApiProperty()
    createdAt: Date;

    @IsDate()
    @ApiProperty()
    updatedAt: Date;
}