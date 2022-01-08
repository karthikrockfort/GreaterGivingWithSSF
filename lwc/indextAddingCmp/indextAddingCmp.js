import { LightningElement, api } from 'lwc';

export default class IndextAddingCmp extends LightningElement {

    @api addingIndex ;
    addCount ; 

    connectedCallback(){ 
       this.addCount =  this.addingIndex + 1;   
    }
}