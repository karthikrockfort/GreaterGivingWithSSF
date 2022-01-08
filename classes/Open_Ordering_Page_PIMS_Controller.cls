public withOut sharing class Open_Ordering_Page_PIMS_Controller {
    
    /*
    @AuraEnabled
    public static string insertPimsOrders(string pimsOrderType, string pimsSelectedAccountId, string pimsSelectedProgram,
                                          string pimsNumOfPackets,string pimsPatientId,string pimgOrderList)
    {
        string returnMsg = 'SUCCESS';                                        
        List<PIMS_Order_Line_Item__c> createPimsOrderLines = new List<PIMS_Order_Line_Item__c>();       
        
        list<OrderPageWrapper> wrapperList = (list<OrderPageWrapper>) System.JSON.deserialize(pimgOrderList,list<OrderPageWrapper>.class);   
        system.debug('wrappeerswList'+wrapperList);
        
        savepoint dbSavePint = Database.setSavepoint();
         
        PIMS_Order__c insertPimsOrder = new PIMS_Order__c();
        insertPimsOrder.Facility__c = pimsSelectedAccountId;
        insertPimsOrder.Order_Status__c = Constant_AC.PIMS_ORDER_STATUS; 
        insertPimsOrder.Order_Type__c = pimsOrderType;
        
        try{
            INSERT insertPimsOrder;
        }
        catch(DmlException ex){
            returnMsg = ex.getMessage();
            Database.rollback(dbSavePint); 
            system.debug('ERROR : '+ ex.getMessage() );
        }
               
        PIMS_Packet_Series__c insertPimsPacket = new PIMS_Packet_Series__c();
        insertPimsPacket.PIMS_Order__c = insertPimsOrder.id;
        insertPimsPacket.Number_Of_Packets__c = 12;
        
        try{
            INSERT insertPimsPacket;
        }
        catch(DmlException ex){
            returnMsg = ex.getMessage();
            Database.rollback(dbSavePint);
            system.debug('ERROR : '+ ex.getMessage() );
        }
        
        for(OrderPageWrapper interateLineItem : wrapperList)
        {
            if(string.isNotBlank(interateLineItem.selectedRecord)){
                PIMS_Order_Line_Item__c insertPimsOderItem = new PIMS_Order_Line_Item__c();
                insertPimsOderItem.PIMS_Order__c = insertPimsOrder.id;
                insertPimsOderItem.PIMS_Packet_Series__c = insertPimsPacket.id;
                insertPimsOderItem.PIMS_Medication__c = interateLineItem.selectedRecord;
                insertPimsOderItem.Quantity__c = interateLineItem.quantity ;
                //insertPimsOderItem.Special_Instructions__c = interateLineItem.instructions;
                createPimsOrderLines.add(insertPimsOderItem);
            }
        }
        
        
        if(! createPimsOrderLines.isEmpty() ){
            
            try{
                INSERT createPimsOrderLines;
            }
            catch(DmlException ex){
                returnMsg = ex.getMessage();
                Database.rollback(dbSavePint);
                system.debug('ERROR : '+ ex.getMessage() );
            }
        }
      return returnMsg;
    } */
    
    //fectch the default record
    @AuraEnabled
    public static sObject fetchDefaultRecord(string selectedProgram) {
        string recordId = selectedProgram;     
        string sQuery = 'Select Id, Name, Hidden_Iteam_Id_And_Description__c From PIMS_Medication__c Where Id = : recordId LIMIT 1';
        for (sObject obj: database.query(sQuery)) {
            return obj;
        }
        return null;
    }
    
    
    
    @AuraEnabled(cacheable=true) 
    public static List<sObject> fetchLookupData(String searchKey, String sObjectApiName, String selectedProgram, String orderType) {    
        List < sObject > returnList = new List < sObject > ();
        
        system.debug('searchKey'+searchKey);
        system.debug('sObjectApiName'+sObjectApiName); 
        
        string sWildCardText = '%' + searchKey + '%';
        string sQuery = 'SELECT Id, Hidden_Iteam_Id_And_Description__c, Item_Description__c FROM ' + sObjectApiName + ' WHERE Program__c = \'' 
            + selectedProgram + '\'' +' AND Order_Type__c = \'' + orderType + '\' AND Hidden_Iteam_Id_And_Description__c Like : sWildCardText order by createdDate DESC ';
        
        for (sObject obj: database.query(sQuery)) {
            returnList.add(obj); 
        }
        return returnList;
    }
    
    // get list of facilities
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts(){
        return [SELECT Id, Name, PIMS_Reconciliation_Date__c, PIMS_Provider__c
                FROM Account WHERE PIMS_Provider__c = true AND PIMS_Program__c != NULL
                AND PIMS_Reconciliation_Date__c <= TODAY];
    }
    
    // get list of programs
    @AuraEnabled(cacheable=true)
    public static List<String> getPrograms(String accountId){
        System.debug('**accountId**'+accountId);
        Account selectedAccount = [SELECT PIMS_Program__c FROM Account WHERE Id = :accountId];
        List<String> programs = selectedAccount.PIMS_Program__c.split(';');
        return programs;
    }
    
    //Get medication options
    @AuraEnabled(cacheable=true)
    public static List<PIMS_Medication__c> getMedications(String programName){
        system.debug('**debug1.0**'+programName);
        return [SELECT Id, Item_Description__c, Program__c
                FROM PIMS_Medication__c 
                WHERE Program__c =: programName];
    }
    
    /**
* Aura enabled method to search a specified SObject for a specific strings
*/
    @AuraEnabled
    public static List<sObject> searchRecords(String searchString, String sObjectAPIName, String primaryFieldToShow, 
                                              String[] additionalFields, String filterField, String filterCriteria, 
                                              Integer maxRecordLimit){
                                                  
                                                  searchString = String.escapeSingleQuotes(searchString);
                                                  sObjectAPIName = String.escapeSingleQuotes(sObjectAPIName);
                                                  
                                                  String fields  = '';
                                                  if(additionalFields != null && additionalFields.size() > 0){                                   
                                                      fields = ',' + String.join(additionalFields, ','); 
                                                  }
                                                  
                                                  String queryStr = 'SELECT Id, ' + primaryFieldToShow + fields + ' FROM ' + sObjectAPIName +
                                                      ' WHERE ' + filterField + ' like \'%' + searchString + '%\'' +
                                                      ((String.isNotBlank(filterCriteria)) ? ' AND ' + filterCriteria : '')+
                                                      ' LIMIT '+ maxRecordLimit;
                                                  
                                                  /* String queryStr = 'SELECT Id, ' + primaryFieldToShow + fields + ' FROM ' + sObjectAPIName +
' WHERE ' + filterField + ' = \'%' + selectedProgram + '%\'' + ' AND ' + 'TestFormula__c' +
' like \'%' + searchString + '%\'' +
' LIMIT '+ maxRecordLimit;       

system.debug('queryStr' + queryStr);          */                        
                                                  
                                                  List<sObject> lstOfRecords = new List<sObject>(Database.query(queryStr));
                                                  return lstOfRecords;
                                              }
    
    @AuraEnabled
    public static List<sObject> getSelectedRecord(String recordId, String sObjectAPIName, String primaryFieldToShow){
        
        sObjectAPIName = String.escapeSingleQuotes(sObjectAPIName);
        
        String queryStr = 'SELECT Id, ' + primaryFieldToShow + ' FROM ' + sObjectAPIName +
            ' WHERE Id = \'' + recordId + '\'';
        
        List<sObject> lstOfRecords = new List<sObject>(Database.query(queryStr));
        return lstOfRecords;
    }

    /* *
    //Method to save the Packet Series as a Order, Packet Series and Order Lines
    //@Param : packetSeries with Order LInes and related information
    * */
    @AuraEnabled
    public static string placePimsOrder(String pimsOrderType, String pimsSelectedAccountId, String pimsOrderList) {
        System.debug('**debug**');
        System.debug(pimsOrderList);
        string returnMsg = 'SUCCESS';
        List<PacketWrapper> packetSeriesList = new List<PacketWrapper>();
        Map<Integer, PIMS_Packet_Series__c> pktSerKey_packetSerMap = new Map<Integer, PIMS_Packet_Series__c>();
        Map<Integer, List<OrderLineWrapper>> pktSerKey_orderLineWrapList = new Map<Integer, List<OrderLineWrapper>>();

        List<PIMS_Packet_Series__c> packetSeriesSFList = new List<PIMS_Packet_Series__c>();
        List<PIMS_Order_Line_Item__c> packetOrderLineSFList = new List<PIMS_Order_Line_Item__c>();
        
        System.debug('-->' + pimsOrderList);
        
        if(pimsOrderList != '') {
            packetSeriesList = (List<PacketWrapper>) System.JSON.deserialize(pimsOrderList, List<PacketWrapper>.class); 
            savepoint dbSavePint = Database.setSavepoint();
            
            //Insert PIMS Order 
            PIMS_Order__c pimsOrder = new PIMS_Order__c();
            pimsOrder.Facility__c = pimsSelectedAccountId;
            pimsOrder.Order_Status__c = Constant_AC.PIMS_ORDER_STATUS; 
            pimsOrder.Order_Type__c = pimsOrderType;
            
            try{
                insert pimsOrder;
            }
            catch(DmlException ex){
                returnMsg = ex.getMessage();
                Database.rollback(dbSavePint); 
                system.debug('ERROR : '+ ex.getMessage() );
            }

            //Insert Packet Series
            PIMS_Packet_Series__c pktSerObj;
            for(PacketWrapper pk : packetSeriesList) {
                pktSerObj = new PIMS_Packet_Series__c();
                pktSerObj.Number_Of_Packets__c      =   Decimal.valueOf(pk.numOfPackets);
                pktSerObj.Patient_ID__c             =   pk.patientId;
                pktSerObj.PIMS_Order__c             =   pimsOrder.ID;
                pktSerObj.Special_Instructions__c   =   pk.specialInst;
                packetSeriesSFList.add(pktSerObj);
                if(!pktSerKey_packetSerMap.containsKey(pk.packetSeries)) {
                    pktSerKey_packetSerMap.put(pk.packetSeries, pktSerObj);
                    pktSerKey_orderLineWrapList.put(pk.packetSeries, pk.totalListProd);
                }
            }

            if(packetSeriesSFList.size() > 0) {
                try {
                  insert packetSeriesSFList;
                } catch(DmlException ex){
                    returnMsg = ex.getMessage();
                    Database.rollback(dbSavePint);
                    system.debug('ERROR : '+ ex.getMessage() );
                }
            }
            
            //Insert Order Line Items
            PIMS_Order_Line_Item__c orderLine;
            for (Integer mapKey : pktSerKey_orderLineWrapList.keySet()) {
                for (OrderLineWrapper ordLineWrap : pktSerKey_orderLineWrapList.get(mapKey)) {
                    orderLine                           =   new PIMS_Order_Line_Item__c();
                    orderLine.PIMS_Medication__c        =   ordLineWrap.selectedRecord;
                    orderLine.PIMS_Packet_Series__c     =   pktSerKey_packetSerMap.get(mapKey).Id;
                    orderLine.Quantity__c               =   ordLineWrap.quantity;
                    //orderLine.Special_Instructions__c   =   ordLineWrap.instructions;
                    orderLine.PIMS_Order__c             =   pimsOrder.Id;
                    packetOrderLineSFList.add(orderLine);
                }
            }
            //DML for order lines
            if (packetOrderLineSFList.size() > 0) {
                try {
                    insert packetOrderLineSFList;
                } catch(DmlException ex){
                    returnMsg = ex.getMessage();
                    Database.rollback(dbSavePint);
                    system.debug('ERROR : '+ ex.getMessage() );
                }
            }

        }
        System.debug('-->'+pktSerKey_packetSerMap);
        return returnMsg;
    }
    
    public class OrderPageWrapper{
       
        public decimal quantity;
        public string instructions;
        public string key;
        public string selectedRecord;
        public string programRecordId;
        public string selectedAaccountId;
    }

    public class OrderLineWrapper {
        public Integer quantity;
        public String instructions;
        public String key;
        public String selectedRecord;
        public String programRecordId;
        public String selectedAccountId;
        public String selectedProgName;
        public String selectedRecordItemDescrip;
    }

    public class PacketWrapper {
        
        public Integer packetSeries;
        public String numOfPackets;
        public String patientId;
        public String specialInst;

        List<OrderLineWrapper> totalListProd;

        public PacketWrapper () {
            totalListProd = new List<OrderLineWrapper>();
        }
    }
}