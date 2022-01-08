import { LightningElement,api,wire} from 'lwc';
// import apex method from salesforce module 
import fetchLookupData from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.fetchLookupData';
import fetchDefaultRecord from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.fetchDefaultRecord';

const DELAY = 300; // dealy apex callout timing in miliseconds  

export default class CustomLookupComponent extends LightningElement {    
// public properties with initial default values 
@api placeholder = 'search...'; 
@api iconName = 'custom:PIMS_Medication__c';   
@api sObjectApiName = 'PIMS_Medication__c';  
@api passedIndex = '';      
@api selectedProgram = '';
@api orderType = '';      

@api  selectedRecordParent = {};   

// private properties  
lstResult = []; // to store list of returned records   
hasRecords = true; 
searchKey=''; // to store input field value    
isSearchLoading = false; // to control loading spinner  
delayTimeout;
selectedRecord = {}; // to store selected lookup record in object formate 

// initial function to populate default selected lookup record if defaultRecordId provided  
connectedCallback(){


        let prepopulateRecord = JSON.parse(JSON.stringify(this.selectedRecordParent));
    //   console.log('prepopulateRecord'+ anotherPrepolulate);  
        
        if(prepopulateRecord.selectedRecord != ''){       
        console.log('****========***');  
        fetchDefaultRecord({ 'selectedProgram': prepopulateRecord.selectedRecord})   
        .then((result) => { 
            if(result != null){
                this.selectedRecord = result;
                this.handelSelectRecordHelper(); // helper function to show/hide lookup result container on UI
            } 
        })
        .catch((error) => {
            this.error = error;
            this.selectedRecord = {};
        });
        }  
}

// wire function property to fetch search record based on user input
@wire(fetchLookupData, { searchKey: '$searchKey' , sObjectApiName : '$sObjectApiName' ,
                        selectedProgram : '$selectedProgram', orderType : '$orderType' })   
    searchResult(value) {
    
    const { data, error } = value; // destructure the provisioned value
    this.isSearchLoading = false;
    if (data) {
            this.hasRecords = data.length == 0 ? false : true; 
            this.lstResult = JSON.parse(JSON.stringify(data)); 
        }
    else if (error) {
        console.log('(error---> ' + JSON.stringify(error));
        }
};
    
// update searchKey property on input field change  
handleKeyChange(event) {
    console.log('**2**electedProgram***',this.selectedProgram);
    // Debouncing this method: Do not update the reactive property as long as this function is
    // being called within a delay of DELAY. This is to avoid a very large number of Apex method calls.
    console.log('searchkeyfired 1', this.searchKey );
    this.isSearchLoading = true;
    window.clearTimeout(this.delayTimeout);
    const searchKey = event.target.value;
    this.delayTimeout = setTimeout(() => {
    this.searchKey = searchKey;
    }, DELAY);
}


// method to toggle lookup result section on UI 
toggleResult(event){
    console.log('**3**electedProgram***',this.selectedProgram);
    const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
    const clsList = lookupInputContainer.classList;
    const whichEvent = event.target.getAttribute('data-source');
    switch(whichEvent) {
        case 'searchInputField':
            clsList.add('slds-is-open');
            break;
        case 'lookupContainer':
            clsList.remove('slds-is-open');    
        break;                    
        }
}

// method to clear selected lookup record  
handleRemove(){
console.log('**4**electedProgram***',this.selectedProgram);
this.searchKey = '';    
this.selectedRecord = {};
this.lookupUpdatehandler(undefined); // update value on parent component as well from helper function 

// remove selected pill and display input field again 
const searchBoxWrapper = this.template.querySelector('.searchBoxWrapper');
    searchBoxWrapper.classList.remove('slds-hide');
    searchBoxWrapper.classList.add('slds-show');

    const pillDiv = this.template.querySelector('.pillDiv');
    pillDiv.classList.remove('slds-show');
    pillDiv.classList.add('slds-hide'); 
} 

// method to update selected record from search result 
handelSelectedRecord(event){   
console.log('**5**electedProgram***',this.selectedProgram);
    var objId = event.target.getAttribute('data-recid'); // get selected record Id 
    this.selectedRecord = this.lstResult.find(data => data.Id === objId); // find selected record from list 
    this.lookupUpdatehandler(this.selectedRecord); // update value on parent component as well from helper function 
    this.handelSelectRecordHelper(); // helper function to show/hide lookup result container on UI
}

/*COMMON HELPER METHOD STARTED*/

handelSelectRecordHelper(){
console.log('**7**electedProgram***',this.selectedProgram);
this.template.querySelector('.lookupInputContainer').classList.remove('slds-is-open');

    const searchBoxWrapper = this.template.querySelector('.searchBoxWrapper');
    searchBoxWrapper.classList.remove('slds-show');
    searchBoxWrapper.classList.add('slds-hide');

    const pillDiv = this.template.querySelector('.pillDiv');
    pillDiv.classList.remove('slds-hide');
    pillDiv.classList.add('slds-show');     
} 

// send selected lookup record to parent component using custom event
lookupUpdatehandler(value){    
console.log('**8**electedProgram***',this.selectedProgram); 
const oEvent = new CustomEvent('lookupupdate',
{
    'detail': {selectedRecord: value , customIndex : this.passedIndex }         
}
); 
this.dispatchEvent(oEvent); 
}


}