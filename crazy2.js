(async () => {
    const baseUrl = "https://deckofcardsapi.com/api/deck/";
    const deckIdKey = "DECK_ID";

    async function getNewShuffledDeck(){
        return await fetch(baseUrl + 'new/shuffle/');
    }
    async function getDeck(deckId){
        return await fetch(baseUrl + deckId + '/');
    }

    async function drawCards(deckId, n){
        return await fetch(baseUrl + deckId + '/draw/?count=' + n);
    }
    async function putCardInPile(deckId, pileName, cards){
        let cardCodes = cards.map(card => card.code).join(',');
        return await fetch(baseUrl + deckId + '/pile/' + pileName + '/add/?cards=' + cardCodes);
    }
    async function getCardsInPile(deckId, pileName){
        return await fetch(baseUrl + deckId + '/pile/' + pileName + '/list/');
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

    let computerHand = [];
    let humanHand = [];
    let discardPile = [];

    //Check if game has started
    if (remaining === 52){ 
        const response = await drawCards(deckId, 11);
        const cardsInfo = await response.json();
        const cards = cardsInfo.cards;
        computerHand = cards.slice(0, 5);
        humanHand = cards.slice(5, 10);
        discardPile = cards.slice(10);
        await Promise.all([
            putCardInPile(deckId, 'human', humanHand),
            putCardInPile(deckId, 'computer', computerHand),
            putCardInPile(deckId, 'discard', discardPile),
        ]);
        
    } else {
        const responses = await Promise.all([
            getCardsInPile(deckId, 'human'),
            getCardsInPile(deckId, 'computer'),
            getCardsInPile(deckId, 'discard'),
        ]);
        const pileInfos = await Promise.all(responses.map(response => response.json()));
        humanHand = pileInfos[0].piles.human.cards;
        computerHand = pileInfos[1].piles.computer.cards;
        discardPile = pileInfos[2].piles.discard.cards;
    }
    const humanImages = humanHand
        .map(card => card.image)
        .map(url => '<img src="'+ url + '" class="upcard">');
    document.getElementById('human').innerHTML = humanImages.join('');
    
    console.log('computer: ' , computerHand);
    console.log('human: ', humanHand);
    console.log('discard: ', discardPile);

})();