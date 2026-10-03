import {
  Component,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Chat as ChatService, Message } from '../../services/chat';

import { Auth } from '../../services/auth';

import { Navbar as NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);

  @ViewChild('messagesContainer')
  private messagesContainer!: ElementRef;

  messages: Message[] = [];

  userId!: number;
  currentUserId!: number;

  newMessage = '';

  // ==============================
  // OTHER USER
  // ==============================

  otherUsername = '';
  otherPhoto: string | null = null;

  // ==============================
  // EMOJI
  // ==============================

  showEmojiPicker = false;

  emojis: string[] = [
    '😀',
    '😂',
    '😍',
    '🥰',
    '😘',
    '😊',
    '😉',
    '❤️',
    '💕',
    '💖',
    '👍',
    '👏',
    '🙏',
    '🔥',
    '🎉',
    '😎',
    '🤗',
    '😢',
    '😭',
    '😡',
    '🤣',
    '🥹',
    '🤔',
    '🙈',
  ];

  // ==============================
  // UPLOAD
  // ==============================

  uploadingFile = false;

  // ==============================
  // SCROLL
  // ==============================

  private shouldScroll = false;

  // ==============================
  // CONTEXT MENU
  // ==============================

  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  selectedMessage: Message | null = null;

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));

    // ==============================
    // CURRENT USER
    // ==============================

    this.auth.getMe().subscribe({
      next: (user) => {
        console.log('CURRENT USER:', user);

        this.currentUserId = Number(user.id);

        this.loadMessages();
      },

      error: (error) => {
        console.error('Erreur utilisateur connecté:', error);
      },
    });

    // ==============================
    // OTHER USER
    // ==============================

    this.loadOtherUser();
  }

  // =========================================================
  // LOAD OTHER USER
  // =========================================================

  private loadOtherUser(): void {
    this.auth.getUser(this.userId).subscribe({
      next: (response) => {
        console.log('==============================');

        console.log('OTHER USER API RESPONSE:', response);

        console.log('==============================');

        /*
         * API Platform peut retourner:
         *
         * response
         *
         * ou:
         *
         * response.data
         *
         * ou:
         *
         * response['hydra:member'][0]
         */

        const user = response?.data ?? response?.['hydra:member']?.[0] ?? response;

        console.log('USER FINAL:', user);

        // ==========================
        // USERNAME
        // ==========================

        const username = user?.username ?? user?.userName ?? user?.name ?? '';

        this.otherUsername = String(username);

        // ==========================
        // PHOTO
        // ==========================

        const photo = user?.photo ?? user?.profilePhoto ?? user?.image ?? null;

        if (photo) {
          this.setOtherPhoto(String(photo));
        } else {
          this.otherPhoto = null;
        }

        console.log('FINAL USERNAME:', this.otherUsername);

        console.log('FINAL PHOTO:', this.otherPhoto);
      },

      error: (error) => {
        console.error('ERREUR GET USER:', error);
      },
    });
  }

  // =========================================================
  // PHOTO URL
  // =========================================================

  setOtherPhoto(photo: string | null): void {
    if (!photo) {
      this.otherPhoto = null;

      return;
    }

    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      this.otherPhoto = photo;

      return;
    }

    this.otherPhoto = `http://127.0.0.1:8000${photo}`;
  }

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  loadMessages(): void {
    this.chatService.getMessages(this.userId).subscribe({
      next: (messages) => {
        this.messages = messages;

        this.shouldScroll = true;
      },

      error: (error) => {
        console.error('Erreur messages:', error);
      },
    });
  }

  // =========================================================
  // SEND TEXT
  // =========================================================

  sendMessage(): void {
    const content = (this.newMessage ?? '').trim();

    if (!content) {
      return;
    }

    this.newMessage = '';

    this.showEmojiPicker = false;

    this.sendMessageToBackend(content, 'text', null);
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  private sendMessageToBackend(
    content: string,
    type: 'text' | 'image' | 'video',
    mediaUrl: string | null,
  ): void {
    const temporaryMessage: Message = {
      id: -Date.now(),

      sender: this.currentUserId,

      receiver: this.userId,

      content,

      type,

      mediaUrl,

      createdAt: new Date().toISOString(),
    };

    // AFFICHAGE IMMÉDIAT
    this.messages = [...this.messages, temporaryMessage];

    this.shouldScroll = true;

    // BACKEND
    this.chatService.sendMessage(this.userId, content, type, mediaUrl).subscribe({
      next: (response) => {
        console.log('MESSAGE SENT:', response);

        const realMessage = response?.data ?? response;

        this.messages = this.messages.map((message) => {
          if (message.id === temporaryMessage.id) {
            return {
              id: realMessage.id,

              sender: Number(realMessage.sender),

              receiver: Number(realMessage.receiver),

              content: realMessage.content,

              type: realMessage.type,

              mediaUrl: realMessage.mediaUrl,

              createdAt: realMessage.createdAt,
            };
          }

          return message;
        });
      },

      error: (error) => {
        console.error('Erreur envoi message:', error);

        this.messages = this.messages.filter((message) => message.id !== temporaryMessage.id);
      },
    });
  }

  // =========================================================
  // EMOJI
  // =========================================================

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.newMessage += emoji;

    this.showEmojiPicker = false;
  }

  // =========================================================
  // IMAGE
  // =========================================================

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.uploadFile(input.files[0]);

    input.value = '';
  }

  // =========================================================
  // VIDEO
  // =========================================================

  selectVideo(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.uploadFile(input.files[0]);

    input.value = '';
  }

  // =========================================================
  // UPLOAD
  // =========================================================

  private uploadFile(file: File): void {
    if (this.uploadingFile) {
      return;
    }

    this.uploadingFile = true;

    this.chatService.uploadChatFile(file).subscribe({
      next: (response) => {
        console.log('UPLOAD:', response);

        const type = response.type as 'image' | 'video';

        const url = response.url;

        if (!type || !url) {
          this.uploadingFile = false;

          return;
        }

        this.sendMessageToBackend('', type, url);

        this.uploadingFile = false;
      },

      error: (error) => {
        console.error('Erreur upload:', error);

        this.uploadingFile = false;
      },
    });
  }

  // =========================================================
  // MEDIA URL
  // =========================================================

  getMediaUrl(mediaUrl: string | null | undefined): string {
    if (!mediaUrl) {
      return '';
    }

    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }

    return `http://127.0.0.1:8000${mediaUrl}`;
  }

  // =========================================================
  // MY MESSAGE
  // =========================================================

  isMyMessage(message: Message): boolean {
    return Number(message.sender) === Number(this.currentUserId);
  }

  // =========================================================
  // TIME
  // =========================================================

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // =========================================================
  // CONTEXT MENU
  // =========================================================

  openContextMenu(event: MouseEvent, message: Message): void {
    event.preventDefault();

    event.stopPropagation();

    this.selectedMessage = message;

    const menuWidth = 190;
    const menuHeight = 150;
    const margin = 10;

    let x = event.clientX;

    let y = event.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - margin;
    }

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - margin;
    }

    x = Math.max(margin, x);

    y = Math.max(margin, y);

    this.contextMenuX = x;
    this.contextMenuY = y;

    this.contextMenuVisible = true;
  }

  // =========================================================
  // CLOSE MENU
  // =========================================================

  closeContextMenu(): void {
    this.contextMenuVisible = false;

    this.selectedMessage = null;
  }

  // =========================================================
  // CLICK OUTSIDE
  // =========================================================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.closest('.message-context-menu')) {
      return;
    }

    this.closeContextMenu();
  }

  // =========================================================
  // COPY
  // =========================================================

  copySelectedMessage(): void {
    if (!this.selectedMessage) {
      return;
    }

    const message = this.selectedMessage;

    this.closeContextMenu();

    if (!message.content) {
      return;
    }

    navigator.clipboard.writeText(message.content).catch((error) => {
      console.error('Erreur copie:', error);
    });
  }

  // =========================================================
  // SHARE
  // =========================================================

  sendSelectedMessage(): void {
    if (!this.selectedMessage) {
      return;
    }

    const message = this.selectedMessage;

    this.closeContextMenu();

    if (!message.content) {
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          text: message.content,
        })
        .catch(() => {});

      return;
    }

    navigator.clipboard.writeText(message.content).catch((error) => {
      console.error('Erreur partage:', error);
    });
  }

  // =========================================================
  // DELETE
  // SUPPRESSION IMMÉDIATE À L'ÉCRAN
  // =========================================================

  deleteSelectedMessage(): void {
    if (!this.selectedMessage) {
      return;
    }

    const message = this.selectedMessage;

    // فقط رسائلي
    if (!this.isMyMessage(message)) {
      this.closeContextMenu();

      return;
    }

    // حفظ position
    const index = this.messages.findIndex((m) => m.id === message.id);

    // حذف فوري من écran
    this.messages = this.messages.filter((m) => m.id !== message.id);

    // سد menu مباشرة
    this.closeContextMenu();

    // حذف من DB
    this.chatService.deleteMessage(message.id).subscribe({
      next: () => {
        console.log('Message supprimé:', message.id);
      },

      error: (error) => {
        console.error('Erreur suppression:', error);

        // رجع الرسالة فقط إذا فشل السيرفر
        if (index !== -1) {
          this.messages.splice(index, 0, message);
        }
      },
    });
  }

  // =========================================================
  // SCROLL
  // =========================================================

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;

      this.shouldScroll = false;
    }
  }
}
