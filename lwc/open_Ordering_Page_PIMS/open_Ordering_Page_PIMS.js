import { LightningElement,api, wire, track } from 'lwc';

import getSpecificAccounts from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.getAccounts';
import getMedications from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.getMedications';
import getPrograms from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.getPrograms';
//import createPIMSorders from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.insertPimsOrders';
import placePimsOrder from '@salesforce/apex/Open_Ordering_Page_PIMS_Controller.placePimsOrder';  
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OpenOrderingPagePims extends LightningElement {  

//variables starts here
showInitialSection = true; //showMainPage = true;  
disableAccountSection = false ; //recCheck= false; 
showOrderingPage = false;
showOrderReviewPage = false;    
isItReview          = false;


@track selectedAccountId;
@track Accountlist = []; //@track familyOptions = [];    
@track currentPacketSeries;

shippingAddress = false;
vaccineDeliveries = false;
  
//outOfOffice;

ordTypeOptions = 
[
    {label : 'Bulk', value : 'Bulk'},
    {label : 'Packet', value : 'Packet'}
];  

@track orderType;


@track ord = {
quantity : '',
instructions : '',
key : '',
selectedRecord: '',
selectedProgName: '',
selectedAccountId:'',
selectedRecordItemDescrip:''
}

@api selectedProgram = ''; 
@api programOptions;

//variables ends here   
@track medOptions = [];
//	@track availableItems = [];
@track finalOrderList = []; 
@track orderList = []; 
@track index = 0;
@track item;
@track quantity;  
@track instructions;  

//@api selectedValue;
// @api fieldToSelect;
@api isReferenceField = false;
@api sObjectName = 'PIMS_Medication__c';
@api label;
//  @api pluralLabel;
// @api listIconName;
@api listIconClass = 'slds-icon-custom-11';
@api primaryFieldToShow = 'Item_Description__c';
@api additionalFieldsToShow;
@api filterField = 'Program__c';
// @api maxRecordLimit = 10;


//@track filterCriteria;
// @track searchResults;
@track selectedRecord;
//@track showsearchResults = false; 
// @track listOfSearchRecords;
numOfPackets;
specialInst;
patientId;
//recordsToReview = []; 




connectedCallback() {
    this.getAccountlist();    
}


// getFamilyOptions() {   
getAccountlist() {
    this.addDefaultRow();
    console.log('getSpecificAccounts');
    getSpecificAccounts() 
        .then(result => {                
            let tempOptions = [];
            for (let i = 0; i < result.length; i++) {
                tempOptions.push({ "label": result[i].Name, "value": result[i].Id });
                //this.accountsById[result[i].Id] = result[i];
            }
            if(result.length > 0) {
                //this.recCheck = false; 
                this.disableAccountSection = false;
            }
            this.Accountlist = [...tempOptions]
            
        })
        .catch(error => {

        });
}



handleFamilyOptionChange(event) {
    this.selectedAccountId = event.detail.value;
    console.log('this.selectedAccountId '+this.selectedAccountId );
    this.getProgramOptions(); 
}    

shippingAddressChange(event){ 
    this.shippingAddress = event.target.checked; 
    console.log(this.shippingAddress);
}

isNumber(event){ 

    event = (event) ? event : window.event;
    var charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 101 && charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;   
    }
    return true;   

}
    
vaccineDeliveriesChange(event){
    this.vaccineDeliveries = event.target.checked;
    console.log(this.vaccineDeliveries);
}

/*
outOfOfficeChange(event){
    this.outOfOffice = event.target.value;    
} */
    

handleForwardNavigation() {
    if(this.shippingAddress && this.vaccineDeliveries && this.selectedAccountId != undefined){    
        this.showInitialSection = false;
        this.showOrderingPage = true;
    }else{
        alert('Please verify all required conditions to proceed with this order.');
    }
}

orderTypeChange(event){
    this.orderType = event.target.value; 
    console.log('orderType',this.orderType); 
}  


showSelection(){
    // Hide the Input Element 
    this.addClassElement('lookup','slds-hide');

    console.log('**hand showSelection** called**');
    // Show the Lookup pill
    this.removeClassElement('lookup-pill','slds-hide');
    
    // Lookup Div has selection
    this.addClassElement('lookup-div','slds-has-selection');

}

/**
 * Clear the Selection
 */
clearSelection(){
    this.ord.searchString = '';
    //  this.listOfSearchRecords ='';
    this.ord.selectedRecord = '';
    this.ord.selectedValue = '';

    this.clearSelectedRecord();
    // Hide the Lookup pill
    this.addClassElement('lookup-pill','slds-hide');

    // Show the Input Element
    this.removeClassElement('lookup','slds-hide');

    // Lookup Div has no selection
    this.removeClassElement('lookup-div','slds-has-selection');
}

clearSelectedRecord(){
    this.dispatchEvent(
        new CustomEvent("clearselectrecord", {
            
        })
    );
}


addClassElement(elementId,className){
    var dataId = '.'+elementId;//'[data-id='+elementId+']';
    var inputElement = this.template.querySelectorAll(dataId);
    if(inputElement && inputElement.length>0){
        this.template.querySelectorAll(dataId)[0].classList.add(className);
    } 
}


removeClassElement(elementId,className){
    var dataId = '.'+elementId//'[data-id='+elementId+']';
    var inputElement = this.template.querySelectorAll(dataId);
    if(inputElement && inputElement.length> 0){
        this.template.querySelectorAll(dataId)[0].classList.remove(className);
    } 
}


onSelectProgram(event){ 
    console.log('*****praveen******'); 
    this.selectedProgram = event.detail.value;
    console.log('*****praveen******', this.selectedProgram);
    this.getMedicationOptions();
}

getMedicationOptions() {
    getMedications({programName : this.selectedProgram})
        .then(result => {                 
            let tempMedOptions = [];
            for (let i = 0; i < result.length; i++) {
                tempMedOptions.push({ "label": result[i].Item_ID__c + ' - ' + result[i].Item_Description__c, "value": result[i].Id });
            }
            this.medOptions = [...tempMedOptions]
            console.log('this.medOptions',this.medOptions);  
        })
        .catch(error => {

        });
}


getProgramOptions() {
    console.log(this.selectedAccountId);
    getPrograms({accountId : this.selectedAccountId})
        .then(result => {   
            console.log('**if result**'+this.selectedAccountId);
            console.log(result);             
            let tempOptions = [];
            for (let i = 0; i < result.length; i++) {
                tempOptions.push({ "label": result[i], "value": result[i] });
            }
            this.programOptions = [...tempOptions]
            
        })
        .catch(error => {
            console.log('****'+this.selectedAccountId);
        });
}


        

handleBack(event) {
    this.showInitialSection = true; 
    this.showOrderingPage = false;
    this.showOrderReviewPage = false; 
}

handleReview(event){
    
    console.log('Error listing2');
    console.log(this.orderList.length);

    if (this.orderList.length > 0 && !this.isItReview) {
        this.showToastMessage('Error', 'Please add the packet series before review', 'error');
        return;
    }
    
    if (!this.finalOrderList.length > 0) {
        this.showToastMessage('Error', 'No order to review, please add packet series and medications first', 'error');
        return;
    }
    console.log(this.finalOrderList.length);
    
    this.showOrderReviewPage = true;
    this.showInitialSection = false;
    this.showOrderingPage = false;  
    
} 



handleSaveOrder(event) {

    console.log(this.finalOrderList); 
    console.log(this.orderList);  
    let holdArrayCheckEmpty = JSON.stringify(this.orderList); 
    let hodlParsedArray = JSON.parse(holdArrayCheckEmpty);

  let emptyRemovedArray = this.orderList.filter(function (item) { 
    if (item.selectedRecordItemDescrip == '') {
      return false; 
    }
    return true;  
  })
  
   console.log(emptyRemovedArray); 
   this.orderList = emptyRemovedArray;    
   console.log( this.orderList);   


 /*   hodlParsedArray.forEach( function (eachObj){ 
        for (var key in eachObj) {
            if (eachObj.hasOwnProperty(key)){  

                if( key == 'selectedRecordItemDescrip' && eachObj[key] == ''){   
                   let index = hodlParsedArray.findIndex( age => age.selectedRecordItemDescrip == '');   
                   console.log('-----index-1---', index);  
                   hodlParsedArray.splice(index ,1); 
                            
                }  

               console.log(key,eachObj[key]); 
               console.log(hodlParsedArray);  
              // console.log(this.orderList);       
            }
        }
    });   */ 

   // this.orderList = hodlParsedArray;   

    console.log(hodlParsedArray);        

    if (this.passingEditArrayIndex == '' && this.orderList.length != 0 && hodlParsedArray[0].selectedRecord != ''){ 
        debugger   
            
            let finalArrayMap = {  
                packetSeries : this.finalOrderList.length + 1,    
                numOfPackets : this.numOfPackets,
                specialInst  : this.specialInst,
                patientId : this.patientId, 
                totalListProd : this.orderList   
            }; 
            this.finalOrderList.push(finalArrayMap);   
    
        } 
        else if(this.passingEditArrayIndex != ''){ 

              if( this.orderList && this.orderList.length == 0 ){
                let tempOderList = this.finalOrderList;
                let removedOder =   tempOderList.splice(this.passingEditArrayIndex ,1);   
                 console.log('removedOder', JSON.stringify(removedOder));    
                 console.log('tempOderList', JSON.stringify(tempOderList) );    
                 this.finalOrderList = tempOderList;   
              }
              else{ 
                this.finalOrderList[this.passingEditArrayIndex].numOfPackets = this.numOfPackets;
                this.finalOrderList[this.passingEditArrayIndex].specialInst = this.specialInst;
                this.finalOrderList[this.passingEditArrayIndex].patientId = this.patientId;
                this.finalOrderList[this.passingEditArrayIndex].totalListProd = this.orderList;  
              } 
           
        } 
        else if(this.orderList.length == 0 ){
            this.showToastMessage('warning', 'No packet series was added', 'warning');  
        }
        else if (this.finalOrderList.length == 0){ 
            this.showToastMessage('ERROR', 'No packet was added.', 'ERROR');  
        }   
         
        this.orderType = 'Packet'; 
        this.selectedProgram = '';
        this.numOfPackets = '';
        this.specialInst = '';
        this.patientId = ''; 
        this.orderList = [];

    if(this.finalOrderList.length != 0){ 
        this.showOrderReviewPage = true;
        this.showOrderingPage = false;          
        this.showInitialSection = false;
    } 

    /*   var idxVal  = event.target.dataset.id;
    this.finalOrderList[idxVal].totalListProd = [];
    
    for (var i=0; i < this.orderList.length; i++) {
        console.log('****'+this.orderList.length);
        this.finalOrderList[idxVal].totalListProd.push(this.orderList[i]);
        console.log('**sd**'+this.finalOrderList);
    }
    this.currentPacketSeries = '';*/  
    console.log(JSON.stringify(this.orderList));
    console.log(this.currentPacketSeries);
}


handleBackToOrdering (event) {
    this.showOrderingPage = true;          
    this.showOrderReviewPage = false;
    this.showInitialSection = false;
} 

// packetSeries = 0;  

handleSaveAndNewAdd(event) { 

    let holdArrayCheckEmpty = JSON.stringify(this.orderList); 
    let hodlParsedArray = JSON.parse(holdArrayCheckEmpty);

    let emptyRemovedArray = this.orderList.filter(function (item) { 
        if (item.selectedRecordItemDescrip == '') {
          return false; 
        }
        return true;  
      })
      
       console.log(emptyRemovedArray); 
       this.orderList = emptyRemovedArray;    
       console.log( this.orderList);  
     


  //  debugger  
     if (this.passingEditArrayIndex == '' && this.orderList.length != 0 && hodlParsedArray[0].selectedRecord != ''){  
     
        let finalArrayMap = {  
            packetSeries : this.finalOrderList.length + 1,    
            numOfPackets : this.numOfPackets,
            specialInst  : this.specialInst,
            patientId : this.patientId, 
            totalListProd : this.orderList   
        }; 
        this.finalOrderList.push(finalArrayMap);    
    } 
    else if(this.orderList.length == 0 || hodlParsedArray[0].selectedRecord == ''){   
        this.showToastMessage('Error', 'Please add the packet series before add', 'error'); 
    } 
  /*  else{ 
        this.finalOrderList[this.passingEditArrayIndex].numOfPackets = this.numOfPackets;
        this.finalOrderList[this.passingEditArrayIndex].patientId = this.patientId;
        this.finalOrderList[this.passingEditArrayIndex].totalListProd = this.orderList;  
    } */  

   // debugger    
    this.orderType = 'Packet';
    this.selectedProgram = '';
    this.numOfPackets = '';
    this.specialInst = '';
    this.patientId = '';
    this.orderList = [];
    this.passingEditArrayIndex = ''; 
    console.log('finalOrderList', this.finalOrderList);

    /*   var holdButtonName = event.target.dataset.id;
    console.log('this.orderList'+this.orderList); 

    createPIMSorders({ pimsOrderType : this.orderType, pimsSelectedAccountId : this.selectedAccountId ,
                        pimsSelectedProgram : this.selectedProgram, pimsNumOfPackets : this.numOfPackets ,
                        pimsPatientId : this.patientId, pimgOrderList : JSON.stringify(this.finalOrderList)}) 
    .then(result=>{  
        
        
    if(result == 'SUCCESS' && holdButtonName == 'SaveandNewTrigger'){
        this.orderType = 'Packet';  
        // this.selectedAccountId = '';   
        this.selectedProgram = '';  
        this.numOfPackets = '';
        this.patientId = '';
        this.orderList = [];
    }
    else if (result == 'SUCCESS' && holdButtonName == 'SaveTrigger'){
        this.showOrderReviewPage = true;
        this.showInitialSection = false;
        this.showOrderingPage = false;   
    } 
    })  
    .catch(error=>{   
        console.log('---error----',error);   
        //  alert('Error',error.body.message);
    }) */

    }   


    handleEditOnReview (event) {
        var myval = event.target.dataset.id;
        this.setRedirectValues(myval);
        this.currentPacketSeries = myval;    
        this.isItReview = true;
        this.showOrderingPage = true;          
        this.showOrderReviewPage = false;
        this.showInitialSection = false;
    }


    handDeleteOnReview(event){ 
        console.log('handDeleteOnReview', event.target.dataset.id);    
        let parseIndext = JSON.parse(event.target.dataset.id);  
        this.finalOrderList.splice(parseIndext,1);        
        if(this.finalOrderList.length == 0){ 
            this.showOrderingPage = true;          
            this.showOrderReviewPage = false; 
            this.showInitialSection = false;
        }  
        
    }


passingEditArrayIndex ='';

setRedirectValues(idx) {
    this.orderList = []; 
    let orderList = this.orderList || [];  
    this.passingEditArrayIndex = idx; 


    for (var j = 0; j < this.finalOrderList[idx].totalListProd.length; j++){ 

        this.numOfPackets       = this.finalOrderList[idx].numOfPackets;
        this.specialInst        = this.finalOrderList[idx].specialInst;
        this.patientId          = this.finalOrderList[idx].patientId; 
        this.selectedProgram    = this.finalOrderList[idx].totalListProd[j].selectedProgName;   

        let ord = { 
            quantity : this.finalOrderList[idx].totalListProd[j].quantity,
            instructions : this.finalOrderList[idx].totalListProd[j].instructions,
            key :  this.finalOrderList[idx].totalListProd[j].key,
            selectedRecord: this.finalOrderList[idx].totalListProd[j].selectedRecord,
            selectedProgName:this.finalOrderList[idx].totalListProd[j].selectedProgName,
            selectedAccountId : this.finalOrderList[idx].totalListProd[j].selectedAccountId,
            selectedRecordItemDescrip : this.finalOrderList[idx].totalListProd[j].selectedRecordItemDescrip
        };

        if(orderList && Array.isArray(orderList)){
            orderList.push(ord);  
        }
    } 
    this.orderList = orderList;           



    /*  this.selectedProgram    = this.finalOrderList[idx].totalListProd[0].selectedProgName;
    this.numOfPackets       = this.finalOrderList[idx].numOfPackets;
    this.patientId          = this.finalOrderList[idx].patientId;
    this.index              = this.finalOrderList[idx].totalListProd.length;
    console.log('-index->'+this.index);
    
    let orderList = this.orderList || []; 

    for (var i=0; i < this.finalOrderList[idx].totalListProd.length; i++) {
        console.log(this.finalOrderList[idx].totalListProd[i].quantity);
        let ord = {
            quantity : this.finalOrderList[idx].totalListProd[i].quantity,
            instructions : this.finalOrderList[idx].totalListProd[i].instructions,
            key : this.finalOrderList[idx].totalListProd[i].key,
            selectedRecord: this.finalOrderList[idx].totalListProd[i].selectedRecord,
            selectedProgName: this.selectedProgram,
            selectedAccountId : this.selectedAccountId,
            selectedRecordItemDescrip : this.finalOrderList[idx].totalListProd[i].selectedRecordItemDescrip
        };
        ord.key = this.index;
        if(orderList && Array.isArray(orderList)){
            orderList.push(ord);  
        }
    }
    this.orderList = orderList;
    console.log('**debug**');
    console.log(JSON.stringify(this.orderList));*/   
}

@track jasonStringfy = {};  

lookupRecord(event){    

    //console.log('lookupRecord',event.target.dataset.id);  
    // alert('Selected Record Value on Parent Component is ' +  JSON.stringify(event.detail.selectedRecord));
    
    this.jasonStringfy = JSON.stringify(event.detail.selectedRecord); 
    var jasonStrin = JSON.parse( this.jasonStringfy);    
    
    console.log(this.orderList);   
    //this.index[0].selectedRecord = jasonStrin.Id;    
    
    let reformattedArray = this.orderList.map(obj => { 

    if(obj.key == event.detail.customIndex){       
    obj['selectedRecord'] = jasonStrin.Id;
    obj['selectedRecordItemDescrip'] = jasonStrin.Hidden_Iteam_Id_And_Description__c;    
    }
         
    return obj
    }); 
        console.log('this.orderList', this.orderList);   
}  

@track ord = {
        quantity : '',
        instructions : '',
        key : '',
        selectedRecord: '',
        selectedRecordItemDescrip :''
    }

addRow(event) { 
    
    var i = this.index;
    this.index++; 

    let ord = {
        quantity : this.quantity,
        instructions : this.instructions,
        key : '',
        selectedRecord: '',
        selectedProgName:this.selectedProgram,
        selectedAccountId : this.selectedAccountId,
        selectedRecordItemDescrip : ''
    };
    ord.key = this.index;
    let orderList = this.orderList || []; 

    if(orderList && Array.isArray(orderList)){
        orderList.push(ord);  
    }
    this.orderList = orderList;  
    console.log(JSON.stringify(this.orderList));
    console.log(this.orderList.length);
}

addDefaultRow () {
    var i = this.index;
    this.index++; 

    let ord = {
        quantity : this.quantity,
        instructions : this.instructions,
        key : '',
        selectedRecord: '',
        selectedProgName:this.selectedProgram,
        selectedAccountId : this.selectedAccountId,
        selectedRecordItemDescrip : ''
    };
    ord.key = this.index;
    let orderList = this.orderList || []; 

    if(orderList && Array.isArray(orderList)){
        orderList.push(ord);  
    }
    this.orderList = orderList;  
    console.log(JSON.stringify(this.orderList));
    console.log(this.orderList.length);    
}

removeRow(event){

    var key = parseInt(event.target.dataset.id); 

    if(this.orderList.length > 1){ 
        this.orderList.splice(key, 1);
        this.index--;
        this.ord.key = this.index;
    }else if(this.orderList.length == 1){
        this.orderList = [];
        this.index = 0;
        this.ord.key = 0;
    }
} 

handleNumOfPacketsChange(event) {
    this.numOfPackets = event.detail.value;
}
handlePatientIdChange(event) {
    this.patientId = event.detail.value;
}   
handlespecialInstChange(event) {
    this.specialInst = event.detail.value;
}

@track specialInstruction = '';

handleQuantityChange(event){ 
    
    let numberOfPills = event.detail.value;
    let reformattedArray = this.orderList.map(obj => { 

        if(obj.key == event.target.dataset.id){   
        obj['quantity'] = numberOfPills;     
        }
            
        return obj
        });  
}

handleInstructionsChange(event){
    let instruction = event.detail.value;
    let reformattedArray = this.orderList.map(obj => { 

        if(obj.key == event.target.dataset.id) {
            obj['instructions'] = instruction;      
        }
            
        return obj
        }); 
            console.log('this.orderList', this.orderList);

}

//Handler for saving the record from the order review page : place order button
handleOrderSave(event) { 
    
    console.log(JSON.stringify(this.finalOrderList));

    placePimsOrder({pimsOrderType : this.orderType, pimsSelectedAccountId : this.selectedAccountId,
                    pimsOrderList : JSON.stringify(this.finalOrderList)}).then(result=>{
        if(result == 'SUCCESS') {

            this.finalOrderList = []; 
            this.orderList = [];    
             
            this.showToastMessage('Order placed', 'Your order has been placed successfully', 'success');
            this.redirectToOrderingPage();
        }
    }).catch(error=>{
        console.log(error);
    })
}

redirectToOrderingPage () { 
    this.clearSelection();
    this.showInitialSection     = true; 
    this.showOrderingPage       = false;
    this.showOrderReviewPage    = false; 
    this.selectedAccountId      = '';
    this.shippingAddress        = false;
    this.vaccineDeliveries      = false;
    this.outOfOffice            = '';
    this.orderType              = '';
    this.selectedProgram        = '';
    this.finalOrderList = []; 
    this.orderList = [];
    this.addDefaultRow();     
}

showToastMessage(msgTitle, msgDetail, errType) {
    const event = ShowToastEvent({
        title   : msgTitle,
        message : msgDetail,
        variant : errType
    });
    this.dispatchEvent(event); 
}
    
}