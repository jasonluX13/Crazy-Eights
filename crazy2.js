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
    // async function removeCardFromPile(deckId, pileName, card){
    //     return await fetch(baseUrl + deckId + '/pile/' + pileName + '/draw/?cards=' + card.code);
    // }
    function drawDeckCountRemaining(remaining){
        document.getElementById('deck-count').innerHTML = remaining;
        if (remaining === 0) {
            document.getElementById('deck-count').innerHTML = '<h1>Tie</h1>';
            disableGame();
        }
    }
    function drawHumanThings(humanHand) {
        const humanImages = humanHand
            .map(card => '<img data-code="' + card.code + '"src="' + card.image + '" class="upcard">');
        document.getElementById('human').innerHTML = humanImages.join('');
    }
    function drawDiscardPile(discardPile) {
        const topCard = discardPile[discardPile.length - 1];
        const topCardHtml = '<img class="card" src="' + topCard.image + '">';
        document.getElementById('discard-pile').innerHTML = topCardHtml;
    }
    function drawComputerThings(computerHand) {
        const computerImages = computerHand
            .map(() => '<img class="card upcard">');
        document.getElementById('computer').innerHTML = computerImages.join('');
    }

    function isCardPlayable(clickedCardCode, topCardCode){
        return clickedCardCode[0] === topCardCode[0] ||
            clickedCardCode[1] === topCardCode[1] ||
            clickedCardCode[0] === '8';
    }

    function disableGame(){
        document.getElementById('deck').removeEventListener('click', deckClickHandler);
        document.getElementById('human').removeEventListener('click', handlePlayCard);
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
        remaining = cardsInfo.remaining;
        drawDeckCountRemaining(remaining);
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

    
    drawHumanThings(humanHand);
    drawComputerThings(computerHand)
    drawDiscardPile(discardPile);

    console.log('computer: ' , computerHand);
    console.log('human: ', humanHand);
    console.log('discard: ', discardPile);

    document.getElementById('human')
        .addEventListener('click', handlePlayCard);

    document.getElementById('deck')
        .addEventListener('click', deckClickHandler);

    async function handlePlayCard(event) {
        const target = event.target;
        if (target.hasAttribute('data-code')) {
            const clickedCardCode = target.getAttribute('data-code');
            let topCardCode = discardPile[discardPile.length - 1].code;
            if (isCardPlayable(clickedCardCode, topCardCode)) {
                const cardToMove = humanHand.find(card => card.code === clickedCardCode);
                discardPile.push(cardToMove);
                humanHand = humanHand.filter(card => card.code !== clickedCardCode);

                //await removeCardFromPile(deckId, 'human', cardToMove);
                await putCardInPile(deckId, 'discard', [cardToMove]);
                //redraw UI
                drawHumanThings(humanHand);
                drawDiscardPile(discardPile);
                //computer turn
                topCardCode = discardPile[discardPile.length - 1].code;
                while (true) {
                    let playableComputerCard = computerHand.find(card => isCardPlayable(card.code, topCardCode));

                    if (playableComputerCard !== undefined) {
                        discardPile.push(playableComputerCard);
                        computerHand = computerHand.filter(card => card !== playableComputerCard);
                        await putCardInPile(deckId, 'discard', [playableComputerCard]);
                        break;
                    } else {
                        const response = await drawCards(deckId, 1);
                        const deckInfo = await response.json();
                        remaining = deckInfo.remaining;
                        drawDeckCountRemaining(remaining)
                        const card = deckInfo.cards[0];
                        computerHand.push(card);
                        putCardInPile(deckId, 'computer', [card]);
                        console.log(computerHand);
                    }

                }
                drawComputerThings(computerHand);
                drawDiscardPile(discardPile);
                if (computerHand.length === 0) {
                    document.getElementById('computer').innerHTML = '<h1>Computer Wins</h1>';
                    disableGame();
                } else if (humanHand.length === 0) {
                    document.getElementById('human').innerHTML = '<h1>You Win</h1>';
                    disableGame();
                }
                
                
            }
        }
    }
    async function deckClickHandler() {
        //draw 1 card from deck
        //put that one card in my hand (locally and server)
        const response = await drawCards(deckId, 1);
        const deckInfo = await response.json();
        remaining = deckInfo.remaining;
        drawDeckCountRemaining(remaining);
        const cards = deckInfo.cards;
        const card = cards[0];
        humanHand.push(card);
        putCardInPile(deckId, 'human', [card]);
        drawHumanThings(humanHand);
    }
})();