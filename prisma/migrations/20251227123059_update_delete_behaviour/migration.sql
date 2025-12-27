-- DropForeignKey
ALTER TABLE `Article` DROP FOREIGN KEY `Article_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `ArticlePermission` DROP FOREIGN KEY `ArticlePermission_articleId_fkey`;

-- DropForeignKey
ALTER TABLE `ArticlePermission` DROP FOREIGN KEY `ArticlePermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_chatId_fkey`;

-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectPermission` DROP FOREIGN KEY `ProjectPermission_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectPermission` DROP FOREIGN KEY `ProjectPermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Snippet` DROP FOREIGN KEY `Snippet_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `SnippetPermission` DROP FOREIGN KEY `SnippetPermission_snippetId_fkey`;

-- DropForeignKey
ALTER TABLE `SnippetPermission` DROP FOREIGN KEY `SnippetPermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_projectId_fkey`;

-- DropIndex
DROP INDEX `Article_authorId_fkey` ON `Article`;

-- DropIndex
DROP INDEX `ArticlePermission_articleId_fkey` ON `ArticlePermission`;

-- DropIndex
DROP INDEX `Message_authorId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `Message_chatId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `Project_ownerId_fkey` ON `Project`;

-- DropIndex
DROP INDEX `ProjectPermission_projectId_fkey` ON `ProjectPermission`;

-- DropIndex
DROP INDEX `Snippet_creatorId_fkey` ON `Snippet`;

-- DropIndex
DROP INDEX `SnippetPermission_snippetId_fkey` ON `SnippetPermission`;

-- DropIndex
DROP INDEX `Task_projectId_fkey` ON `Task`;

-- AlterTable
ALTER TABLE `Article` MODIFY `authorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `authorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `ownerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Snippet` MODIFY `creatorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Snippet` ADD CONSTRAINT `Snippet_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArticlePermission` ADD CONSTRAINT `ArticlePermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArticlePermission` ADD CONSTRAINT `ArticlePermission_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPermission` ADD CONSTRAINT `ProjectPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPermission` ADD CONSTRAINT `ProjectPermission_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SnippetPermission` ADD CONSTRAINT `SnippetPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SnippetPermission` ADD CONSTRAINT `SnippetPermission_snippetId_fkey` FOREIGN KEY (`snippetId`) REFERENCES `Snippet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
