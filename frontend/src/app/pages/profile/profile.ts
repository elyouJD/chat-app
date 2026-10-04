import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, Navbar],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private auth = inject(Auth);

  user: any = null;

  editing = false;

  selectedPhoto: File | null = null;

  // الصورة التي ستظهر في الصفحة
  photoUrl: string | null = null;

  // نسخة من البيانات قبل التعديل
  originalUser: any = null;

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (user) => {
        console.log('PROFILE USER:', user);

        this.user = user;

        // نحفظ نسخة قبل التعديل
        this.originalUser = { ...user };

        // تجهيز رابط الصورة
        this.setPhotoUrl(user.photo);
      },

      error: (error) => {
        console.error('Erreur profile:', error);
      },
    });
  }

  // فتح وضع التعديل
  editProfile(): void {
    this.editing = true;

    // نحفظ نسخة من البيانات الحالية
    this.originalUser = { ...this.user };
  }

  // اختيار صورة
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedPhoto = input.files[0];

      console.log('PHOTO SELECTED:', this.selectedPhoto);
    }
  }

  // رفع الصورة
  uploadSelectedPhoto(): void {
    if (!this.selectedPhoto) {
      console.log('Aucune photo sélectionnée');

      return;
    }

    console.log('Photo prête pour upload:', this.selectedPhoto);

    this.auth.uploadPhoto(this.selectedPhoto).subscribe({
      next: (response) => {
        console.log('PHOTO UPLOADED:', response);

        if (response.photo) {
          // نخزن path ديال backend
          this.user.photo = response.photo;

          // نحضر الرابط الكامل للصورة
          this.setPhotoUrl(response.photo);
        }

        // الصورة تم رفعها
        this.selectedPhoto = null;
      },

      error: (error) => {
        console.error('Erreur upload photo:', error);
      },
    });
  }

  // تجهيز رابط الصورة
  setPhotoUrl(photo: string | null): void {
    if (!photo) {
      this.photoUrl = null;

      return;
    }

    // إذا كان الرابط كامل
    if (photo.startsWith('http')) {
      this.photoUrl = photo;

      return;
    }

    // إذا كان /uploads/...
    this.photoUrl = `https://chat-app-backend-m1o3.onrender.com${photo}`;
  }

  // حفظ البروفايل
  saveProfile(): void {
    const data = {
      username: this.user.username,

      age: Number(this.user.age),

      city: this.user.city,

      gender: this.user.gender,

      // مهم:
      // نسيفطو path ديال backend ماشي localhost:4200
      photo: this.user.photo,

      description: this.user.description,
    };

    console.log('PROFILE DATA:', data);

    this.auth.updateMe(data).subscribe({
      next: (response) => {
        console.log('PROFILE UPDATED:', response);

        // نستعمل response مباشرة
        // بلا GET جديد
        this.user = response.user;

        // تحديث الصورة
        this.setPhotoUrl(this.user.photo);

        // نخرج من edit mode
        this.editing = false;

        // نحيد الملف المختار
        this.selectedPhoto = null;
      },

      error: (error) => {
        console.error('Erreur modification profile:', error);
      },
    });
  }

  // إلغاء التعديل
  cancelEdit(): void {
    if (this.originalUser) {
      this.user = { ...this.originalUser };

      this.setPhotoUrl(this.user.photo);
    }

    this.selectedPhoto = null;

    this.editing = false;
  }
}
