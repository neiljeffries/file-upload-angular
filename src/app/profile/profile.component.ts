import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UploadService } from '../upload.service';

export class CSVRecord {
  id: any;
  name: any;
  yesOrNo: any;
  phone: any;
}
const columnCount = 4;
const phonePattern = /^[2-9]\d{2}-\d{3}-\d{4}$/; // 555-555-5555
const namePattern = /^[a-z]([-']?[a-z]+)*( [a-z]([-']?[a-z]+)*)+$/;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  submitDisabled = true;
  form: FormGroup;
  error: string;
  userId = 1;
  uploadResponse = { status: '', message: '', filePath: '' };
  fileName: string;
  fileSize: string;
  fileType: string;
  fileModDate: string;
  lines: string;
  hasHeaders = false;
  public records: any[] = [];
  @ViewChild('csvReader') csvReader: any;

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      avatar: ['']
    });
  }

  constructor(private formBuilder: FormBuilder, private uploadService: UploadService) {}

  onFileChange(event) {
    console.log(event);
    const file = event.target.files[0];
    if (event.target.files.length > 0) {
      this.fileName = event.target.files[0].name;
      this.fileType = event.target.files[0].type;
      this.fileSize = event.target.files[0].size + Math.round(event.target.files[0].size / 1024) + ' KB';
      this.fileModDate = event.target.files[0].lastModifiedDate;

      this.form.get('avatar').setValue(file);
      this.submitDisabled = false;
    }
  }

  uploadListener($event: any): void {
    this.error = '';
    const files = $event.srcElement.files;

    if (this.isValidCSVFile(files[0])) {
      this.onFileChange($event);
      const input = $event.target;
      const reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = () => {
        const csvData = reader.result;
        const csvRecordsArray = (<string>csvData).split(/\r\n|\n/);
        // loop over each row validating expected column count per row and valid phone number format
        for (let i = 0; i < csvRecordsArray.length; i++) {
          const elements = csvRecordsArray[i].split(',');
          this.isValidCSVRecord(elements);
        }

        let headerLength = columnCount;
        if (this.hasHeaders) {
          const headersRow = this.getHeaderArray(csvRecordsArray);
          headerLength = headersRow.length;
        }
        this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headerLength);
      };

      reader.onerror = function() {
        // alert('Error occured while reading file!' + ' ' + reader.error.message);
        // console.log(reader.error.message);
      };
    } else {
      alert('Please upload a valid .csv file.');
      this.fileReset();
    }
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {
    const csvArr = [];
    let startIndex = 0;
    if (this.hasHeaders) {
      startIndex = 1;
    }
    for (let i = startIndex; i < csvRecordsArray.length; i++) {
      const curruntRecord = (<string>csvRecordsArray[i]).split(',');
      if (curruntRecord.length === headerLength) {
        const csvRecord: CSVRecord = new CSVRecord();
        csvRecord.id = curruntRecord[0].trim();
        csvRecord.name = curruntRecord[1].trim();
        csvRecord.yesOrNo = curruntRecord[2].trim();
        csvRecord.phone = curruntRecord[3].trim();
        csvArr.push(csvRecord);
      }
    }
    return csvArr;
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith('.csv');
  }

  isValidCSVRecord(elements: string[]): boolean {
    if (elements.length !== columnCount) {
      // validate the record has four columns
      this.error = JSON.parse('{ "message":"ERROR: Column count does not match. Expected (' + columnCount + ') columns"}');
      this.submitDisabled = true;
      return false;
    }
    if (!this.isValidPhone(elements[columnCount - 1])) {
      // validate phone format
      this.error = JSON.parse('{ "message":"ERROR: Invalid phone found in document"}');
      this.submitDisabled = true;
      return false;
    }
    console.log('all good');
    return true;
  }

  isValidPhone(phone: string): boolean {
    return phonePattern.test(phone);
  }

  isValidName(name: string): boolean {
    return namePattern.test(name);
  }

  isValidYorN(yesOrNo: string): boolean {
    if (yesOrNo.toUpperCase() !== 'Y' || yesOrNo.toUpperCase() !== 'N') {
      this.submitDisabled = true;
      return false;
    }
    return true;
  }

  isValidId(Id: string): boolean {
    return true;
  }

  getHeaderArray(csvRecordsArr: any) {
    const headers = (<string>csvRecordsArr[0]).split(',');
    const headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  fileReset() {
    this.csvReader.nativeElement.value = '';
    this.records = [];
  }

  onSubmit() {
    const formData = new FormData();
    formData.append('file', this.form.get('avatar').value);

    this.uploadService.upload(formData, this.userId).subscribe(
      res => (this.uploadResponse = res),
      err => (this.error = err)
    );
  }
}
