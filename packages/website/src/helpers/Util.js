export let formatNumber = (number) => {
   return  number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export let dashboardColors = {
   activeCases: '#2E7AD0', 
   deaths: "#D02E2E", 
   recoveries: "#50D02E"
};