import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  readonly APIUrl = "http://localhost:5038/api/books/";

  books: any[] = [];

  newTitle = '';
  newDesc = '';
  newPrice: any = '';

  searchQuery = '';
  sortField: 'none' | 'title' | 'price' = 'none';
  sortDir: 'asc' | 'desc' = 'asc';

  toasts: Toast[] = [];
  toastCounter = 0;

  pendingDeleteId: any = null;

  editingId: any = null;
  editTitle = '';
  editDesc = '';
  editPrice: any = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshBooks();
  }

  refreshBooks() {
    this.http.get(this.APIUrl + 'GetBooks').subscribe((data: any) => {
      this.books = data;
    });
  }

  get filteredBooks(): any[] {
    let result = [...this.books];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title?.toLowerCase().startsWith(q)
      );
    }

    if (this.sortField !== 'none') {
      result.sort((a, b) => {
        const valA = this.sortField === 'title' ? a.title?.toLowerCase() : a.price;
        const valB = this.sortField === 'title' ? b.title?.toLowerCase() : b.price;
        return valA < valB
          ? (this.sortDir === 'asc' ? -1 : 1)
          : valA > valB
          ? (this.sortDir === 'asc' ? 1 : -1)
          : 0;
      });
    }

    return result;
  }

  get totalPrice(): number {
    return this.books.reduce((sum, b) => sum + (b.price || 0), 0);
  }

  addBook() {
    if (!this.newTitle.trim() || !this.newDesc.trim() || !this.newPrice) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.newTitle.trim());
    formData.append('description', this.newDesc.trim());
    formData.append('price', String(this.newPrice));

    this.http.post(this.APIUrl + 'AddBook', formData).subscribe({
      next: () => {
        this.showToast(`"${this.newTitle}" added to collection`, 'success');
        this.newTitle = '';
        this.newDesc = '';
        this.newPrice = '';
        this.refreshBooks();
      },
      error: (err) => {
        console.error('Add error:', err);
        this.showToast('Failed to add book', 'error');
      }
    });
  }

  confirmDelete(id: any) {
    this.pendingDeleteId = id;
  }

  cancelDelete() {
    this.pendingDeleteId = null;
  }

  confirmDeleteBook() {
    const book = this.books.find(b => b.id === this.pendingDeleteId);
    this.http.delete(this.APIUrl + 'DeleteBook?id=' + this.pendingDeleteId).subscribe({
      next: () => {
        this.showToast(`"${book?.title}" removed`, 'error');
        this.pendingDeleteId = null;
        this.refreshBooks();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.showToast('Failed to delete book', 'error');
      }
    });
  }

  startEdit(book: any) {
    console.log('Book object:', book);
    this.editingId = book.id;
    this.editTitle = book.title;
    this.editDesc = book.desc;
    this.editPrice = book.price;
  }

  cancelEdit() {
    this.editingId = null;
    this.editTitle = '';
    this.editDesc = '';
    this.editPrice = '';
  }

  saveEdit() {
    if (!this.editTitle.trim() || !this.editDesc.trim() || !this.editPrice) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.editTitle.trim());
    formData.append('description', this.editDesc.trim());
    formData.append('price', String(this.editPrice));

    this.http.put(this.APIUrl + 'UpdateBook?id=' + this.editingId, formData).subscribe({
      next: () => {
        this.showToast(`"${this.editTitle}" updated`, 'success');
        this.cancelEdit();
        this.refreshBooks();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.showToast('Failed to update book', 'error');
      }
    });
  }

  setSort(field: 'title' | 'price') {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info') {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.toasts = this.toasts.filter(t => t.id !== id), 3000);
  }
}
