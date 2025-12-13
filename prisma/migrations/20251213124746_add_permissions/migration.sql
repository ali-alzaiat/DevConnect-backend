-- CreateTable
CREATE TABLE `ArticlePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('VIEW', 'SHARE', 'EDIT') NOT NULL,
    `userId` INTEGER NOT NULL,
    `articleId` INTEGER NOT NULL,

    UNIQUE INDEX `ArticlePermission_userId_articleId_key`(`userId`, `articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('VIEW', 'SHARE', 'EDIT') NOT NULL,
    `userId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,

    UNIQUE INDEX `ProjectPermission_userId_projectId_key`(`userId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SnippetPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('VIEW', 'SHARE', 'EDIT') NOT NULL,
    `userId` INTEGER NOT NULL,
    `snippetId` INTEGER NOT NULL,

    UNIQUE INDEX `SnippetPermission_userId_snippetId_key`(`userId`, `snippetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArticlePermission` ADD CONSTRAINT `ArticlePermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArticlePermission` ADD CONSTRAINT `ArticlePermission_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPermission` ADD CONSTRAINT `ProjectPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPermission` ADD CONSTRAINT `ProjectPermission_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SnippetPermission` ADD CONSTRAINT `SnippetPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SnippetPermission` ADD CONSTRAINT `SnippetPermission_snippetId_fkey` FOREIGN KEY (`snippetId`) REFERENCES `Snippet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
