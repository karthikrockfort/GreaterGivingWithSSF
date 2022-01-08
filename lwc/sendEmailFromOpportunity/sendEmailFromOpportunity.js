import {LightningElement, track, wire,api}from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getEmailTemplates from "@salesforce/apex/SendEmailAlert_AC.getEmailTemplates";
import sendEmailAlert from "@salesforce/apex/SendEmailAlert_AC.sendEmailAlert";
import relatedContacts from "@salesforce/apex/SendEmailAlert_AC.displayRelatedContacts";

let count = 0;
let i=0;
export default class SendEmailFromOpportunity extends LightningElement {

//Variables declaration.
/** Id of record to display. */
@api recordId; //this captures current OpportunityId 
@track items = []; //this holds the array for records with value & label
@track value = '';  //this displays selected value of combo box
@track emailTemplateId = '';
@track typeOptions;
@track opportunityId = ''; 
@track accountRecord;
@track error; 
@track relatedContactId = '';

//This logic used to get opportunity record id.
	connectedCallback() {
		let currentUrl = window.location.href;
		this.opportunityId = currentUrl.split('/')[6];
		console.log('opportunityId', this.opportunityId);
	}
    
	
 //This logic used to query the related contacts
 /* Load Contacts based on opportunity from Controller */
 @wire(relatedContacts, { opportunityId : '$recordId'})
 wiredContacts({ error, data }) {
	 if (data) {
		 for(i=0; i<data.length; i++) {
			 console.log('id=' + data[i].Id);
			 this.items = [...this.items ,{value: data[i].Id , label: data[i].Name}];
		 }                
		 this.error = undefined;
	 } else if (error) {
		 this.error = error;
		 this.contacts = undefined;
	 }
 }

 //getter property from relatedContactOptions which return the items array
 get relatedContactOptions() {
	 console.log(this.items);
	 return this.items;
 }

 
//This logic used to all email templates from GG Email Templates folder.
    @wire(getEmailTemplates, {})
	wiredTemplateName({error, data}) {
		if(data) {
  
			try {
				let tempintem = [];
				for(count = 0; count < data.length; count++) {
					tempintem.push({
						value: (data[count].Id).toString(),
						label: data[count].Name
					});
				}
				this.typeOptions = tempintem;
				console.log('typeOptions', this.typeOptions);

			} catch(error) {
				console.error('check error here 1', error);
			}
		} else if(error) {
			console.error('check error here 2', error);
		}
	}
      //This logic used to get a selected contact id.
   handleContactChange(event) {
	this.relatedContactId = event.detail.value;
	console.log('this.relatedContactId ', this.relatedContactId);
    }


    //This logic used to get a selected template id.
	handleChange(event) {
		this.emailTemplateId = event.detail.value;
		console.log('this.emailTemplateId ', this.emailTemplateId);
	}

    
    //This logic used to send the email alert. 
	handleButtonClick() {
		console.log('Button Clicked--->', this.emailTemplateId);
		console.log('relatedContactId-->', this.relatedContactId);
		sendEmailAlert({
			emailTemplateId: this.emailTemplateId,
			opportunityId: this.opportunityId,
			relatedContactId: this.relatedContactId
		}).then(result => {

            if(result == 'The email was sent successfully...') {
				const evt = new ShowToastEvent({
					title: 'Success',
					message: result,
					variant: 'success',
					mode: 'dismissable'
				});
				this.dispatchEvent(evt);
			} else {
				const evt = new ShowToastEvent({
					title: 'Error',
					message: result,
					variant: 'Error',
					mode: 'dismissable'
				});
				this.dispatchEvent(evt);
			}
			
		}).catch(error => {
			
			const evt = new ShowToastEvent({
				title: 'Error',
				message: error,
				variant: 'error',
				mode: 'dismissable'
			});
			this.dispatchEvent(evt);
		
		})
	}
}