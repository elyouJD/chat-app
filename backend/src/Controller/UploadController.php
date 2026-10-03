<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class UploadController extends AbstractController
{
    #[Route('/api/upload-photo', name: 'api_upload_photo', methods: ['POST'])]
    public function uploadPhoto(Request $request): JsonResponse
    {
        $file = $request->files->get('photo');

        if (!$file) {
            return new JsonResponse([
                'message' => 'Aucune photo reçue'
            ], 400);
        }

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($file->getMimeType(), $allowedMimeTypes, true)) {
            return new JsonResponse([
                'message' => 'Format de photo non autorisé'
            ], 400);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return new JsonResponse([
                'message' => 'La photo ne doit pas dépasser 5 MB'
            ], 400);
        }

        $uploadsDirectory = $this->getParameter('kernel.project_dir')
            . '/public/uploads';

        $fileName = uniqid() . '.' . $file->guessExtension();

        try {
            $file->move($uploadsDirectory, $fileName);
        } catch (FileException $e) {
            return new JsonResponse([
                'message' => 'Erreur lors de l upload'
            ], 500);
        }

        return new JsonResponse([
            'message' => 'Photo uploadée avec succès',
            'photo' => '/uploads/' . $fileName
        ], 201);
    }
}
