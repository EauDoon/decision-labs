export const buyer=(id,quantity=1)=>({id,label:id,category:'Coffee',quantity,maxUnitPrice:10,latestDeliveryDays:5,allowedVariants:['Plain']});
export const offer=(id,capacity=5)=>({id,merchant:id,category:'Coffee',variant:'Plain',unitPrice:5,minimumUnits:1,deliveryDays:2,capacity,shippingPerBuyer:0});
export const fixture=()=>({title:'Synthetic organizer review',currency:'AUD',buyers:[buyer('A',2),buyer('B',3)],offers:[offer('One'),offer('Two',2)]});
