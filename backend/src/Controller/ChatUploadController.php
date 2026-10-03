<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class ChatUploadController
{
    #[Route('/api/chat/upload', name: 'api_chat_upload', methods: ['POST'])]
    public function upload(
        Request $request,
        Security $security
    ): JsonResponse {

        $user = $security->getUser();

        if (!$user instanceof User) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        $file = $request->files->get('file');

        if (!$file instanceof UploadedFile) {
            return new JsonResponse([
                'message' => 'Aucun fichier envoyé'
            ], 400);
        }

        if (!$file->isValid()) {
            return new JsonResponse([
                'message' => 'Erreur lors de l upload du fichier'
            ], 400);
        }

        $mimeType = $file->getMimeType();

        $allowedImages = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ];

        $allowedVideos = [
            'video/mp4',
            'video/webm',
            'video/quicktime',
        ];

        if (in_array($mimeType, $allowedImages, true)) {

            $type = 'image';
        } elseif (in_array($mimeType, $allowedVideos, true)) {

            $type = 'video';
        } else {

            return new JsonResponse([
                'message' => 'Type de fichier non autorisé'
            ], 400);
        }

        $maxSize = 50 * 1024 * 1024;

        if ($file->getSize() > $maxSize) {

            return new JsonResponse([
                'message' => 'Le fichier est trop volumineux. Maximum 50 MB.'
            ], 400);
        }

        $uploadDirectory =
            dirname(__DIR__, 2)
            . '/public/uploads/chat';

        if (!is_dir($uploadDirectory)) {

            mkdir(
                $uploadDirectory,
                0777,
                true
            );
        }

        $extension =
            $file->guessExtension()
            ?? $file->getClientOriginalExtension();

        $filename =
            bin2hex(random_bytes(16))
            . '.'
            . $extension;

        $file->move(
            $uploadDirectory,
            $filename
        );

        $url =
            '/uploads/chat/'
            . $filename;

        return new JsonResponse([
            'message' => 'Fichier uploadé avec succès',
            'type' => $type,
            'url' => $url,
        ], 201);
    }
}
