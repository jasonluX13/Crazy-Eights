(async () => {
    const baseUrl = "https://deckofcardsapi.com/api/deck/";
    const deckIdKey = "DECK_ID";

    async function getNewShuffledDeck(){
        return await fetch(baseUrl + 'new/shuffle/');
    }
    async function getDeck(deckId){
        return await fetch(baseUrl + deckId + '/');
    }
    let deckId = localStorage.getItem(deckIdKey);
   
    let response = undefined;

    if (deckId !== null) {
        response = await getDeck(deckId);
    } else {
        response = await getNewShuffledDeck();
    }
    const deckInfo = await response.json();
    let remaining = deckInfo.remaining;
  
    deckId = deckInfo.deck_id;
    localStorage.setItem(deckIdKey, deckId);
    

    console.log(deckId, remaining);

})();