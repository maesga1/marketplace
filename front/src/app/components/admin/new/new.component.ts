import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Genre } from 'src/app/models/Genre';
import { ComicService } from 'src/app/services/comic.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { FileUploadService } from '../../../services/file-upload.service';
import { Observable } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
})
export class NewComponent implements OnInit {
  @ViewChild('formcomics') formcomics!: NgForm;
  myForm: FormGroup;
  selectedFiles?: FileList;
  currentFile?: File;
  fileName?: any;
  progress = 0;
  message = '';
  preview = '';
  imageInfos?: Observable<any>;
  genres: Genre[] = [];
  currentGenres: Genre[] = [];
  currentGenre!: Genre;
  covers: string[] = ['Tapa Dura', 'Tapa Blanda'];
  @ViewChild('divList')
  divList!: ElementRef;
  staticHtml = '<div class="insert"></div>'

  constructor(
    private comicService: ComicService,
    private uploadService: FileUploadService,
    fb: FormBuilder
  ) {
    this.myForm = fb.group({
      isbn: ['', [Validators.required, Validators.pattern('[0-9]{13}')]],
      title: [''],
      author: [''],
      ishardcover: [false],
      photo: [''],
      price: [0],
      synopsis: [''],
      stock: [0],
      genre: [],
    });
  }
  ngOnInit(): void {
    this.imageInfos = this.uploadService.getFiles();
    this.getGenres();
  }
  getGenres(): void {
    this.comicService.getGenres().subscribe((genres) => {
      this.genres = genres;
    });
  }

  onSubmit() {
    this.upload();
    this.myForm.controls['photo'].setValue(this.fileName);
    if (this.myForm.valid) {
      const comicData = this.myForm.value;
      let genreData = {
        genres: this.currentGenres,
      };
      Object.assign(comicData, genreData);
      console.log(comicData);
      this.comicService.newComic(comicData).subscribe(
        (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Nuevo Comic',
            text: 'Añadido con éxito!',
          }).then(() => {
            // this.router.navigate(['/']);
          });
        },
        (error: any) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error durante el registro de nuevo comic',
          });
          console.error('Error durante el registro de nuevo comic', error);
        }
      );
    }
  }

  selectFile(event: any): void {
    this.message = '';
    this.preview = '';
    this.progress = 0;
    this.selectedFiles = event.target.files;

    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);

      if (file) {
        this.preview = '';
        this.currentFile = file;

        const reader = new FileReader();

        reader.onload = (e: any) => {
          console.log(e.target.result);
          this.preview = e.target.result;
        };

        reader.readAsDataURL(this.currentFile);
      }
    }
  }
  upload(): void {
    this.progress = 0;

    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);
      this.fileName = file?.name;

      if (file) {
        this.currentFile = file;

        this.uploadService.upload(this.currentFile).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.progress = Math.round((100 * event.loaded) / event.total);
            } else if (event instanceof HttpResponse) {
              this.message = event.body.message;
              this.imageInfos = this.uploadService.getFiles();
            }
          },
          error: (err: any) => {
            console.log(err);
            this.progress = 0;

            if (err.error && err.error.message) {
              this.message = err.error.message;
            } else {
              this.message = 'Could not upload the image!';
            }

            this.currentFile = undefined;
          },
        });
      }

      this.selectedFiles = undefined;
    }
  }

  newGenre(selectedGenre: Genre) {
    this.currentGenre = selectedGenre;
    // Swal.fire({
    //   icon: 'success',
    //   title: 'Genero seleccionado:',
    //   text: `${this.currentGenre.name}`,
    // })
    // console.log(this.currentGenre.name);
  }
  addGenreToList(genre:Genre) 
  {
    this.addGenre(genre);
  }
  addGenre(genre: Genre) {
    this.currentGenres.push(genre);
    console.log('añadido = ' + genre.name);
  }
  deleteGenre(index:number){
    console.log("function deleteGenre-> index=" + index);
    this.currentGenres.forEach(currentGenre=>console.log(currentGenre.name));
    this.currentGenres.splice(index,1);    
  }
  renderGenreList(){
    const div = this.divList.nativeElement.querySelector(".insert");
    const itemLista = document.createElement('div');
    for (let i = 0; i < this.currentGenres.length; i++) {
      let genreName = this.currentGenres[i].name;      
      itemLista.innerHTML =
        genreName +
        ' ' +
        '<button (click)="this.deleteGenre(' +
        i +
        ')">Eliminar</button>'; 
        console.log("genre index"+i);     
    }
    div.appendChild(itemLista);
  }
}
