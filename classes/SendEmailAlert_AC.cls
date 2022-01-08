/*************************************************************************************************************
* Name              :  SendEmailAlert_AC
* Summary           :  This SendEmailAlert_AC class is used to get a template and send the email alert.
* Author            :  MST
* Date              :  05/18/2021
*
* Modification Log :
* Developer                 Date                   Description
* -----------------------------------------------------------------------------------------------------------                
*Karthik                 05/18/2021         Send the email alert -As part of GGF-143
*Vaishnavi 				 09/02/2021         Send the email Alert to particular related contact - As a part of GGF -143
*Vaishnavi               09/14/2021         Missing the subject in the email body - As a part of GGF-347
*Vaishnavi 				 10/13/2021         Updating for the ESO Username - As a part of GGF-380
*/
public class SendEmailAlert_AC {
    //This method used display the related contacts on opportunity page
    @auraenabled(cacheable=true)
    Public Static List<contact> displayRelatedContacts(String opportunityId){ 
        Set<Id> contactSet =new Set<Id>();
        Map<Id,Contact> allPrimaryContacts = new Map<id,Contact>();
        List<contact> contactRelatedList =new List<contact>();
        
        for(OpportunityContactRole contactRole :[Select contactId,opportunityId FROM OpportunityContactRole 
                                                 Where OpportunityId =: opportunityId]){
                                                     contactSet.add(contactRole.contactId);
                                                 }
       List<contact> contactList = [SELECT Id,Name FROM Contact Where id =:contactSet];
       return contactList;
    }
    
    //This method used to all all email templates from GG Email Templates folder.
    @auraenabled(cacheable=true)    
    public static List<EmailTemplate> getEmailTemplates(){  
        List<EmailTemplate> emailTemplates = new List<EmailTemplate>();
        
        For(EmailTemplate getTemplateName : [SELECT Name, FolderName FROM 
                                             EmailTemplate WHERE Folder.Name =: Constants_AC.EMAIL_TEMPLATE_FOLDER]){
                                                 emailTemplates.add(getTemplateName);  
                                             }
        return emailTemplates;
    }
    
    
    //This methoed used to send the email alert. 
    @auraenabled(cacheable=true)
    Public Static String sendEmailAlert(String emailTemplateId,String opportunityId,String relatedContactId){  
        String returnMessage = '';
        String emailUserName ='';
        String portalURL='';
        List<OpportunityContactRole> emailToOpportunity = New List<OpportunityContactRole>(); 
        List<Contact> emailToContact = New List<Contact>();        
        List<EmailTemplate> emailTemplate = New List<EmailTemplate>();
        List<Registration__c> registrationRecord = New List<Registration__c>();
        List<Registration__c> registrationESOProductRecord = New List<Registration__c>();
        List<OrgWideEmailAddress> fromEmailAddress = new List<OrgWideEmailAddress>();
        
        If(String.isBlank(emailTemplateId)){
            returnMessage = 'Please select the Email Template...';
        }
        else If(String.isNotBlank(relatedContactId)){
            
            try{
                fromEmailAddress = [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress 
                                    WHERE Address =:  System.Label.SendEmailFromOrg_WideEmailAddress];
               
                emailToContact = [SELECT Id,Name,Email FROM Contact WHERE Id =:relatedContactId ]; 
                emailToOpportunity = [SELECT OpportunityId,Opportunity.Primary_Contact__r.Email, Role,Opportunity.AccountId,Opportunity.Account.Name,
                                      Opportunity.Primary_Contact__c FROM OpportunityContactRole WHERE OpportunityId =: opportunityId]; 
                
                
                registrationRecord = [SELECT Account__c, UserName__c,Product__r.Name,Portal_URL__c FROM Registration__c 
                                      WHERE Account__c =: emailToOpportunity[0].Opportunity.AccountId AND
                                      Product__r.Name =: Constants_AC.REGISTRATION_PRODUCT_NAME LIMIT 1];   
                
                registrationESOProductRecord = [SELECT Account__c, UserName__c,Product__r.Name FROM Registration__c 
                                                WHERE Account__c =: emailToOpportunity[0].Opportunity.AccountId AND
                                                Product__r.Name =: Constants_AC.REGISTRATION_ESO_PRODCUT_NAME LIMIT 1]; 
                
                
                emailTemplate = [SELECT Id, Subject,Name,Body,HtmlValue FROM 
                                 EmailTemplate WHERE Id =: emailTemplateId LIMIT 1];
                
                if(emailTemplate[0].Name == Constants_AC.OP_EMAILTEMPLATENAME ){
                    emailUserName = registrationRecord[0].UserName__c;
                }
                else{
                    emailUserName = registrationESOProductRecord[0].UserName__c;
                }
                 If(registrationRecord[0].Portal_URL__c != null){
                    portalURL = registrationRecord[0].Portal_URL__c;
                }
                else{
                    portalURL = '';
                }     
            }
            Catch(Exception ex) 
            {
                returnMessage = 'Please check your records...'; 
            }
        }
        else{
            returnMessage = 'Please select the Contact'; 
        }
        
        
        If(! emailToContact.isEmpty() && String.isNotBlank(fromEmailAddress[0].Address)){
            
            String emailBody = emailTemplate[0].HtmlValue;
            String emailSubject = emailTemplate[0].Subject;

            emailSubject = emailSubject.replace('{!Opportunity.Account}', emailToOpportunity[0].Opportunity.Account.Name);
            emailBody = emailBody.replace(']]>','');
            
            If((! registrationRecord.IsEmpty() || !registrationESOProductRecord.IsEmpty()) && String.isNotBlank(emailUserName)) {
                emailBody = emailBody.replace('{!Registration__c.UserName__c}',emailUserName);
                emailBody = emailBody.replace('[apqa.ejoinme.org]apqa.ejoinme.org',portalURL); 
            }
            else{
                emailBody = emailBody.replace('{!Registration__c.UserName__c}',''); 
                emailBody = emailBody.replace('[apqa.ejoinme.org]apqa.ejoinme.org',portalURL);                
            }
            
            Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
            
            message.setTargetObjectId(emailToContact[0].Id); 
            message.setReplyTo(emailToOpportunity[0].Opportunity.Primary_Contact__r.Email);         
            message.setTemplateID(emailTemplateId); 
            message.setHtmlBody(emailBody);            
            message.setSubject(emailSubject);
            message.setOrgWideEmailAddressId(fromEmailAddress.get(0).Id); 
            message.toAddresses = new String[] { emailToContact[0].Email };
                
                Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage> {message};
                    Messaging.SendEmailResult[] results = Messaging.sendEmail(messages);
     
            
            If(results[0].success) 
            {
                returnMessage = 'The email was sent successfully...';  
            } else {
                returnMessage = results[0].errors[0].message ;
            }      
        }
        Return returnMessage;
    }
}
