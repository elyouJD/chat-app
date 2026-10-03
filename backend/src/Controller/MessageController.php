<?php

namespace App\Controller;

use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class MessageController extends AbstractController
{
    // =========================================================
    // SEND MESSAGE
    // =========================================================

    #[Route('/api/send-message', name: 'api_send_message', methods: ['POST'])]
    public function sendMessage(
        Request $request,
        Security $security,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        $sender = $security->getUser();

        if (!$sender instanceof User) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        $data = json_decode(
            $request->getContent(),
            true
        );

        if (!isset($data['receiver'])) {
            return new JsonResponse([
                'message' => 'receiver est obligatoire'
            ], 400);
        }

        // =====================================================
        // TYPE
        // =====================================================

        $type = $data['type'] ?? 'text';

        $allowedTypes = [
            'text',
            'image',
            'video'
        ];

        if (!in_array($type, $allowedTypes, true)) {
            return new JsonResponse([
                'message' => 'Type de message non autorisé'
            ], 400);
        }

        // =====================================================
        // CONTENT
        // =====================================================

        $content = trim(
            $data['content'] ?? ''
        );

        // =====================================================
        // MEDIA URL
        // =====================================================

        $mediaUrl =
            $data['mediaUrl'] ?? null;

        // =====================================================
        // MESSAGE TEXTE
        // =====================================================

        if (
            $type === 'text' &&
            $content === ''
        ) {
            return new JsonResponse([
                'message' => 'content est obligatoire'
            ], 400);
        }

        // =====================================================
        // IMAGE / VIDEO
        // =====================================================

        if (
            in_array(
                $type,
                ['image', 'video'],
                true
            )
            && empty($mediaUrl)
        ) {
            return new JsonResponse([
                'message' => 'mediaUrl est obligatoire'
            ], 400);
        }

        // =====================================================
        // RECEIVER
        // =====================================================

        $receiver = $entityManager
            ->getRepository(User::class)
            ->find($data['receiver']);

        if (!$receiver) {
            return new JsonResponse([
                'message' => 'Utilisateur receiver introuvable'
            ], 404);
        }

        // =====================================================
        // CREATE MESSAGE
        // =====================================================

        $message = new Message();

        $message->setSender($sender);

        $message->setReceiver($receiver);

        $message->setContent($content);

        $message->setType($type);

        $message->setMediaUrl($mediaUrl);

        $entityManager->persist($message);

        $entityManager->flush();

        // =====================================================
        // RESPONSE
        // =====================================================

        return new JsonResponse([

            'message' => 'Message envoyé',

            'data' => [

                'id' =>
                $message->getId(),

                'sender' =>
                $sender->getId(),

                'receiver' =>
                $receiver->getId(),

                'content' =>
                $message->getContent(),

                'type' =>
                $message->getType(),

                'mediaUrl' =>
                $message->getMediaUrl(),

                'createdAt' =>
                $message
                    ->getCreatedAt()
                    ?->format(
                        'Y-m-d H:i:s'
                    ),
            ]

        ], 201);
    }


    // =========================================================
    // GET CHAT
    // =========================================================

    #[Route(
        '/api/chat/{userId}',
        name: 'api_chat',
        methods: ['GET']
    )]
    public function getChat(
        int $userId,
        Security $security,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        $currentUser =
            $security->getUser();

        if (!$currentUser instanceof User) {
            return new JsonResponse([
                'message' =>
                'Utilisateur non authentifié'
            ], 401);
        }

        $otherUser =
            $entityManager
            ->getRepository(User::class)
            ->find($userId);

        if (!$otherUser) {
            return new JsonResponse([
                'message' =>
                'Utilisateur introuvable'
            ], 404);
        }

        $messages =
            $entityManager
            ->getRepository(Message::class)
            ->createQueryBuilder('m')

            ->where(
                '(m.sender = :currentUser AND m.receiver = :otherUser)'
            )

            ->orWhere(
                '(m.sender = :otherUser AND m.receiver = :currentUser)'
            )

            ->setParameter(
                'currentUser',
                $currentUser
            )

            ->setParameter(
                'otherUser',
                $otherUser
            )

            ->orderBy(
                'm.createdAt',
                'ASC'
            )

            ->getQuery()
            ->getResult();

        $result = [];

        foreach ($messages as $message) {

            $result[] = [

                'id' =>
                $message->getId(),

                'sender' =>
                $message
                    ->getSender()
                    ->getId(),

                'receiver' =>
                $message
                    ->getReceiver()
                    ->getId(),

                'content' =>
                $message->getContent(),

                'type' =>
                $message->getType(),

                'mediaUrl' =>
                $message->getMediaUrl(),

                'createdAt' =>
                $message
                    ->getCreatedAt()
                    ?->format(
                        'Y-m-d H:i:s'
                    ),
            ];
        }

        return new JsonResponse(
            $result
        );
    }


    // =========================================================
    // DELETE MESSAGE
    // =========================================================

    #[Route(
        '/api/messages/{id}',
        name: 'api_delete_message',
        methods: ['DELETE']
    )]
    public function deleteMessage(
        int $id,
        Security $security,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        // =====================================================
        // CURRENT USER
        // =====================================================

        $currentUser =
            $security->getUser();

        if (!$currentUser instanceof User) {

            return new JsonResponse([
                'message' =>
                'Utilisateur non authentifié'
            ], 401);
        }

        // =====================================================
        // FIND MESSAGE
        // =====================================================

        $message =
            $entityManager
            ->getRepository(Message::class)
            ->find($id);

        if (!$message) {

            return new JsonResponse([
                'message' =>
                'Message introuvable'
            ], 404);
        }

        // =====================================================
        // SECURITY
        // =====================================================
        // المستخدم يقدر يمسح غير الرسالة ديالو

        if (
            $message
            ->getSender()
            ->getId()
            !==
            $currentUser->getId()
        ) {

            return new JsonResponse([
                'message' =>
                'Vous ne pouvez pas supprimer ce message'
            ], 403);
        }

        // =====================================================
        // DELETE
        // =====================================================

        $entityManager->remove(
            $message
        );

        $entityManager->flush();

        // =====================================================
        // RESPONSE
        // =====================================================

        return new JsonResponse([
            'message' =>
            'Message supprimé avec succès'
        ]);
    }


    // =========================================================
    // GET CURRENT USER
    // =========================================================

    #[Route(
        '/api/me',
        name: 'api_me',
        methods: ['GET']
    )]
    public function me(
        Security $security
    ): JsonResponse {

        $user =
            $security->getUser();

        if (!$user instanceof User) {

            return new JsonResponse([
                'message' =>
                'Utilisateur non authentifié'
            ], 401);
        }

        return new JsonResponse([

            'id' =>
            $user->getId(),

            'username' =>
            $user->getUsername(),

            'email' =>
            $user->getEmail(),

            'age' =>
            $user->getAge(),

            'city' =>
            $user->getCity(),

            'gender' =>
            $user->getGender(),

            'photo' =>
            $user->getPhoto(),

            'description' =>
            $user->getDescription(),
        ]);
    }


    // =========================================================
    // UPDATE CURRENT USER
    // =========================================================

    #[Route(
        '/api/me',
        name: 'api_me_update',
        methods: ['PUT']
    )]
    public function updateMe(
        Request $request,
        Security $security,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        $user =
            $security->getUser();

        if (!$user instanceof User) {

            return new JsonResponse([
                'message' =>
                'Utilisateur non authentifié'
            ], 401);
        }

        $data =
            json_decode(
                $request->getContent(),
                true
            );

        if (isset($data['username'])) {

            $user->setUsername(
                trim(
                    $data['username']
                )
            );
        }

        if (isset($data['age'])) {

            $user->setAge(
                (int) $data['age']
            );
        }

        if (isset($data['city'])) {

            $user->setCity(
                trim(
                    $data['city']
                )
            );
        }

        if (isset($data['gender'])) {

            $user->setGender(
                trim(
                    $data['gender']
                )
            );
        }

        if (isset($data['photo'])) {

            $user->setPhoto(
                $data['photo'] !== null
                    ? trim(
                        $data['photo']
                    )
                    : null
            );
        }

        if (isset($data['description'])) {

            $user->setDescription(
                $data['description'] !== null
                    ? trim(
                        $data['description']
                    )
                    : null
            );
        }

        $entityManager->flush();

        return new JsonResponse([

            'message' =>
            'Profil modifié avec succès',

            'user' => [

                'id' =>
                $user->getId(),

                'username' =>
                $user->getUsername(),

                'email' =>
                $user->getEmail(),

                'age' =>
                $user->getAge(),

                'city' =>
                $user->getCity(),

                'gender' =>
                $user->getGender(),

                'photo' =>
                $user->getPhoto(),

                'description' =>
                $user->getDescription(),
            ]

        ]);
    }
}
