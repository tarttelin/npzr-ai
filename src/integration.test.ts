import { GameEngine } from './GameEngine.js';
import { Character, BodyPart } from './Card.js';
import { PlayerStateType } from './PlayerState.js';
import { Player } from './Player.js';
import { Card } from './Card.js';

// Test helper function to put a specific card on top of the deck
function putCardOnTopOfDeck(engine: GameEngine, character: Character, bodyPart: BodyPart): boolean {
  // Access the private deck through the engine's internal state
  const deck = (engine as any).deck;
  const _players = (engine as any).players;
  const cards = deck.cards;
  
  
  const cardIndex = cards.findIndex((card: Card) => 
    card.character === character && card.bodyPart === bodyPart
  );
  
  if (cardIndex === -1) {
    cards.push(new Card("test-1", character, bodyPart));
    return true; // Hey it's a test so if the card isn't there, just invent a new one.
  }
  
  // Remove the card from its current position
  const [card] = cards.splice(cardIndex, 1);
  
  // Add it to the top (end of array since deck pops from the end)
  cards.push(card);
  
  return true;
}

// Test helper function to get a card from player's hand by character and bodypart
function getCardFromHand(player: Player, character: Character, bodyPart: BodyPart): Card {
  const cards = player.getHand().getCards();
  const card = cards.find(c => c.character === character && c.bodyPart === bodyPart);
  if (!card) {
    throw new Error(`Card ${character} ${bodyPart} not found in ${player.getName()}'s hand`);
  }
  return card;
}

describe('NPZR Game Engine Integration Test', () => {
  let engine: GameEngine;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    engine = new GameEngine();
    engine.createGame();
    player1 = engine.addPlayer('Alice');
    player2 = engine.addPlayer('Bob');
  });

  test('should create game and add players correctly', () => {
    expect(player1.getName()).toBe('Alice');
    expect(player2.getName()).toBe('Bob');
    expect(player1.getId()).toBe('player1');
    expect(player2.getId()).toBe('player2');
  });

  test('should initialize players with correct starting state', () => {
    expect(player1.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
    expect(player2.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    
    expect(player1.getHand().size()).toBe(5);
    expect(player2.getHand().size()).toBe(5);
    
    expect(player1.getMyScore().size()).toBe(0);
    expect(player2.getMyScore().size()).toBe(0);
  });

  test('should allow player 1 to draw a card', () => {
    expect(player1.getState().canDrawCard()).toBe(true);
    
    player1.drawCard();
    
    expect(player1.getHand().size()).toBe(6);
    expect(player1.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
    expect(player1.getState().getMessage()).toBe('Play a card from your hand');
  });

  test('should allow player 1 to play a card after drawing', () => {
    player1.drawCard();
    
    const cards = player1.getHand().getCards();
    expect(cards.length).toBeGreaterThan(0);
    
    const cardToPlay = cards.find(c => !c.isWild())!!;
    expect(player1.getState().canPlayCard()).toBe(true);
    
    player1.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
    
    expect(player1.getHand().size()).toBe(5);
    expect(player1.getMyStacks().length).toBe(1);
    
    const stack = player1.getMyStacks()[0];
    expect(stack.getId()).toBe('stack1');
    expect(stack.getOwnerId()).toBe('player1');
  });

  test('should handle wild card nomination', () => {
    putCardOnTopOfDeck(engine, Character.Ninja, BodyPart.Wild)
    player1.drawCard();
    
    const cards = player1.getHand().getCards();
    const wildCard = cards.find(c => c.bodyPart === BodyPart.Wild && c.character === Character.Ninja)!!;
    
    player1.playCard(wildCard, { targetPile: BodyPart.Head });
    
    expect(player1.getState().getState()).toBe(PlayerStateType.NOMINATE_WILD);
    expect(player1.getState().canNominate()).toBe(true);
    
    player1.nominateWildCard(wildCard, { character: Character.Ninja, bodyPart: BodyPart.Head });
    
    expect(wildCard.hasNomination()).toBe(true);
    expect(wildCard.getEffectiveCharacter()).toBe(Character.Ninja);
    expect(wildCard.getEffectiveBodyPart()).toBe(BodyPart.Head);
    expect(player1.isMyTurn()).toBeTruthy();
    expect(player1.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
  
  });

  test('should prevent invalid actions', () => {
    // Player 2 cannot draw when not their turn
    expect(() => {
      player2.drawCard();
    }).toThrow('Cannot draw card in state: waiting_for_opponent');
    
    // Player 1 cannot play card before drawing
    const cards = player1.getHand().getCards();
    if (cards.length > 0) {
      expect(() => {
        player1.playCard(cards[0]);
      }).toThrow('Cannot play card in state: draw_card');
    }
    
    // Cannot play card not in hand
    player1.drawCard();
  
    const fakeCard = new Card("fake-id", Character.Ninja, BodyPart.Torso);
    expect(() => {
      player1.playCard(fakeCard);
    }).toThrow('Card fake-id not found in hand');
    
  });

  test('should track game state correctly', () => {
    expect(engine.isGameComplete()).toBe(false);
    expect(engine.getWinner()).toBe(null);
  });

  test('should allow access to opponent stacks', () => {
    player1.drawCard();
    const cardToPlay = player1.getHand().getCards().find(c => c.isWild() === false)!!;
    player1.playCard(cardToPlay, { targetPile: cardToPlay.bodyPart });
    
    expect(player1.getMyStacks().length).toBe(1);
    expect(player1.getOpponentStacks().length).toBe(0);
    expect(player2.getMyStacks().length).toBe(0);
    expect(player2.getOpponentStacks().length).toBe(1);
  });

  test('should provide correct player state messages', () => {
    expect(player1.getState().getMessage()).toBe('Draw a card from the deck to start your turn');
    expect(player2.getState().getMessage()).toBe('Waiting for opponent to complete their turn');
    
    player1.drawCard();
    expect(player1.getState().getMessage()).toBe('Play a card from your hand');
  });

  test('should allow controlled card drawing with test helper', () => {
    // Put a specific card on top of the deck
    const cardFound = putCardOnTopOfDeck(engine, Character.Ninja, BodyPart.Head);
    expect(cardFound).toBe(true);
    
    // Player 1 draws and should get the Ninja Head
    player1.drawCard();
    
    const drawnCards = player1.getHand().getCards();
    const ninjaHead = drawnCards.find(card => 
      card.character === Character.Ninja && card.bodyPart === BodyPart.Head
    );
    
    expect(ninjaHead).toBeDefined();
    expect(ninjaHead!.character).toBe(Character.Ninja);
    expect(ninjaHead!.bodyPart).toBe(BodyPart.Head);
  });

  test('should handle valid actions list', () => {
    const actions1 = player1.getState().getValidActions();
    expect(actions1).toHaveLength(1);
    expect(actions1[0].type).toBe('draw');
    
    const actions2 = player2.getState().getValidActions();
    expect(actions2).toHaveLength(0);
    
    player1.drawCard();
    const actionsAfterDraw = player1.getState().getValidActions();
    expect(actionsAfterDraw).toHaveLength(1);
    expect(actionsAfterDraw[0].type).toBe('play');
  });

  test('should play a complete game end-to-end with controlled card order', () => {
    // Create fresh game with controlled setup
    const gameEngine = new GameEngine();
    gameEngine.createGame();
    
    // Set up deck for player 1's initial hand
    putCardOnTopOfDeck(gameEngine, Character.Ninja, BodyPart.Head);
    putCardOnTopOfDeck(gameEngine, Character.Ninja, BodyPart.Legs);
    putCardOnTopOfDeck(gameEngine, Character.Pirate, BodyPart.Wild);
    putCardOnTopOfDeck(gameEngine, Character.Robot, BodyPart.Torso);
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Head);
    const james = gameEngine.addPlayer("James");

    // Set up deck for player 2's initial hand
    putCardOnTopOfDeck(gameEngine, Character.Ninja, BodyPart.Torso);
    putCardOnTopOfDeck(gameEngine, Character.Robot, BodyPart.Head);
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Head);
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Torso);
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Legs);
    const aidan = gameEngine.addPlayer("Aidan");

    // Verify initial state
    expect(james.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
    expect(aidan.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);

    // === JAMES'S FIRST TURN ===
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Torso);
    james.drawCard();
    
    const jamesNinjaHead = getCardFromHand(james, Character.Ninja, BodyPart.Head);
    james.playCard(jamesNinjaHead, { targetPile: BodyPart.Head });
    
    // Should transition to Aidan's turn
    expect(james.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    expect(aidan.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
    expect(james.getMyStacks()).toHaveLength(1);

    // === AIDAN'S FIRST TURN ===
    putCardOnTopOfDeck(gameEngine, Character.Pirate, BodyPart.Torso);
    aidan.drawCard();
    
    const aidanZombieHead = getCardFromHand(aidan, Character.Zombie, BodyPart.Head);
    aidan.playCard(aidanZombieHead, { targetPile: BodyPart.Head });
    
    // Should transition back to James's turn
    expect(aidan.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    expect(james.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
    expect(aidan.getMyStacks()).toHaveLength(1);

    // === JAMES'S SECOND TURN ===
    putCardOnTopOfDeck(gameEngine, Character.Robot, BodyPart.Legs);
    james.drawCard();
    
    const jamesRobotTorso = getCardFromHand(james, Character.Robot, BodyPart.Torso);
    james.playCard(jamesRobotTorso, { targetPile: BodyPart.Torso });
    
    // Should transition to Aidan's turn
    expect(james.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    expect(aidan.getState().getState()).toBe(PlayerStateType.DRAW_CARD);
    expect(james.getMyStacks()).toHaveLength(2); // Now has ninja stack and robot stack

    // === AIDAN'S SECOND TURN ===
    putCardOnTopOfDeck(gameEngine, Character.Ninja, BodyPart.Head);
    aidan.drawCard();
    
    const aidanZombieTorso = getCardFromHand(aidan, Character.Zombie, BodyPart.Torso);
    aidan.playCard(aidanZombieTorso, { targetStackId: aidan.getMyStacks()[0].getId(), targetPile: BodyPart.Torso });
    
    // Should transition back to James
    expect(aidan.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
    expect(james.getState().getState()).toBe(PlayerStateType.DRAW_CARD);

    // === Verify game state ===
    expect(gameEngine.isGameComplete()).toBe(false);
    expect(gameEngine.getWinner()).toBe(null);
    
    // James should have 2 stacks (ninja head, robot torso)
    expect(james.getMyStacks()).toHaveLength(2);
    
    // Aidan should have 1 stack (zombie head + torso)
    expect(aidan.getMyStacks()).toHaveLength(1);
    const aidanZombieStack = aidan.getMyStacks()[0];
    expect(aidanZombieStack.getTopCards().head?.character).toBe(Character.Zombie);
    expect(aidanZombieStack.getTopCards().torso?.character).toBe(Character.Zombie);
    
    // Verify players can see opponent stacks
    expect(james.getOpponentStacks()).toHaveLength(1);
    expect(aidan.getOpponentStacks()).toHaveLength(2);
    
    // === Test completing a stack ===
    putCardOnTopOfDeck(gameEngine, Character.Zombie, BodyPart.Legs);
    james.drawCard();
    
    // Add zombie legs to complete Aidan's zombie stack
    const jamesZombieLegs = getCardFromHand(james, Character.Zombie, BodyPart.Legs);
    
    // James can play on Aidan's stack (defensive play)
    const aidanStack = james.getOpponentStacks()[0];
    james.playCard(jamesZombieLegs, { 
      targetStackId: aidanStack.getId(), 
      targetPile: BodyPart.Legs 
    });
    
    // This should complete Aidan's zombie stack and give Aidan a point
    expect(aidan.getMyScore().hasCharacter(Character.Zombie)).toBe(true);
    expect(aidan.getMyScore().size()).toBe(1);
    
    // The completed stack should be removed
    expect(aidan.getMyStacks()).toHaveLength(0);
    expect(james.getOpponentStacks()).toHaveLength(0);

    expect(james.getState().getState()).toBe(PlayerStateType.MOVE_CARD)
    expect(james.canMoveCard(
      {stackId: james.getMyStacks()[0].getId(), pile: BodyPart.Head}, 
      {stackId: james.getMyStacks()[1].getId(), pile: BodyPart.Head}
    )).toBeTruthy()
    const cardToMove = james.getMyStacks()[0].getHeads()[0].id
    james.moveCard({
      cardId: cardToMove, 
      fromStackId: james.getMyStacks()[0].getId(), 
      fromPile: BodyPart.Head, 
      toStackId: james.getMyStacks()[1].getId(), 
      toPile: BodyPart.Head});
    expect(james.isMyTurn()).toBeFalsy()
    
    console.log('End-to-end test completed successfully!');
  });

  test('should allow wild card continuation after move phase', () => {
    // Create fresh game for this specific scenario
    const testEngine = new GameEngine();
    testEngine.createGame();
    
    // Set up initial hands - give each player some basic cards
    putCardOnTopOfDeck(testEngine, Character.Ninja, BodyPart.Head);
    putCardOnTopOfDeck(testEngine, Character.Robot, BodyPart.Head);
    putCardOnTopOfDeck(testEngine, Character.Pirate, BodyPart.Torso);
    putCardOnTopOfDeck(testEngine, Character.Zombie, BodyPart.Legs);
    putCardOnTopOfDeck(testEngine, Character.Ninja, BodyPart.Torso);
    const testPlayer1 = testEngine.addPlayer("TestPlayer1");

    putCardOnTopOfDeck(testEngine, Character.Pirate, BodyPart.Head);
    putCardOnTopOfDeck(testEngine, Character.Robot, BodyPart.Torso);
    putCardOnTopOfDeck(testEngine, Character.Zombie, BodyPart.Head);
    putCardOnTopOfDeck(testEngine, Character.Pirate, BodyPart.Legs);
    putCardOnTopOfDeck(testEngine, Character.Robot, BodyPart.Legs);
    const testPlayer2 = testEngine.addPlayer("TestPlayer2");

    // === Turn 1: Player 1 plays Ninja Head ===
    putCardOnTopOfDeck(testEngine, Character.Zombie, BodyPart.Torso);
    testPlayer1.drawCard();
    const ninjaHead = getCardFromHand(testPlayer1, Character.Ninja, BodyPart.Head);
    testPlayer1.playCard(ninjaHead, { targetPile: BodyPart.Head });
    
    expect(testPlayer1.getMyStacks()).toHaveLength(1);
    expect(testPlayer1.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);

    // === Turn 1: Player 2 plays something ===
    putCardOnTopOfDeck(testEngine, Character.Ninja, BodyPart.Legs);
    testPlayer2.drawCard();
    const pirateHead = getCardFromHand(testPlayer2, Character.Pirate, BodyPart.Head);
    testPlayer2.playCard(pirateHead, { targetPile: BodyPart.Head });
    
    expect(testPlayer2.getMyStacks()).toHaveLength(1);
    expect(testPlayer2.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);

    // === Turn 2: Player 1 adds Ninja Torso to existing stack ===
    putCardOnTopOfDeck(testEngine, Character.Robot, BodyPart.Head); 
    testPlayer1.drawCard();
    const ninjaTorso = getCardFromHand(testPlayer1, Character.Ninja, BodyPart.Torso);
    testPlayer1.playCard(ninjaTorso, { 
      targetStackId: testPlayer1.getMyStacks()[0].getId(), 
      targetPile: BodyPart.Torso 
    });
    
    // Stack should have head and torso now
    const ninjaStack = testPlayer1.getMyStacks()[0];
    expect(ninjaStack.getTopCards().head?.character).toBe(Character.Ninja);
    expect(ninjaStack.getTopCards().torso?.character).toBe(Character.Ninja);
    expect(ninjaStack.isComplete()).toBe(false);

    // === Turn 2: Player 2 plays something ===
    putCardOnTopOfDeck(testEngine, Character.Pirate, BodyPart.Wild);
    testPlayer2.drawCard();
    const robotTorso = getCardFromHand(testPlayer2, Character.Robot, BodyPart.Torso);
    testPlayer2.playCard(robotTorso, { targetPile: BodyPart.Torso });

    // === Turn 3: Player 1 creates second stack ===
    putCardOnTopOfDeck(testEngine, Character.Ninja, BodyPart.Wild); // Ninja Wild card
    testPlayer1.drawCard();
    const robotHead = getCardFromHand(testPlayer1, Character.Robot, BodyPart.Head);
    testPlayer1.playCard(robotHead, { targetPile: BodyPart.Head });
    
    // Now player 1 should have 2 stacks
    expect(testPlayer1.getMyStacks()).toHaveLength(2);

    // === Turn 3: Player 2 plays something ===
    putCardOnTopOfDeck(testEngine, Character.Zombie, BodyPart.Head);
    testPlayer2.drawCard();
    const pirateWild = getCardFromHand(testPlayer2, Character.Pirate, BodyPart.Wild);
    testPlayer2.playCard(pirateWild, { targetPile: BodyPart.Head });
    // Player 2 needs to nominate the wild
    testPlayer2.nominateWildCard(pirateWild, { character: Character.Pirate, bodyPart: BodyPart.Head });
    
    // After nominating wild, Player 2 can continue playing
    expect(testPlayer2.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
    
    // Player 2 plays another card to end their turn
    putCardOnTopOfDeck(testEngine, Character.Zombie, BodyPart.Head);
    const pirateLegs = getCardFromHand(testPlayer2, Character.Pirate, BodyPart.Legs);
    testPlayer2.playCard(pirateLegs, { targetPile: BodyPart.Legs });
    
    // Now it should be Player 1's turn
    expect(testPlayer1.getState().getState()).toBe(PlayerStateType.DRAW_CARD);

    // === Turn 4: Player 1 plays Ninja Wild as Ninja Legs to complete stack ===
    testPlayer1.drawCard();
    const ninjaWild = getCardFromHand(testPlayer1, Character.Ninja, BodyPart.Wild);
    
    testPlayer1.playCard(ninjaWild, { 
      targetStackId: ninjaStack.getId(), 
      targetPile: BodyPart.Legs 
    });
    
    // Should be in NOMINATE_WILD state
    expect(testPlayer1.getState().getState()).toBe(PlayerStateType.NOMINATE_WILD);
    
    // Nominate the ninja wild card as ninja legs to complete the stack
    testPlayer1.nominateWildCard(ninjaWild, { 
      character: Character.Ninja, 
      bodyPart: BodyPart.Legs 
    });
    
    // Stack should now be complete and player should have earned a move
    expect(testPlayer1.getState().getState()).toBe(PlayerStateType.MOVE_CARD);
    expect(testPlayer1.getMyScore().hasCharacter(Character.Ninja)).toBe(true);
    
    // Player should have 1 remaining stack (ninja stack was removed after completion)
    expect(testPlayer1.getMyStacks()).toHaveLength(1);
    
    // Make the required move - move a card to opponent's stack or create new stack
    const myStack = testPlayer1.getMyStacks()[0];
    const opponentStack = testPlayer2.getMyStacks()[0]; // Move to opponent stack
    const cardToMove = myStack.getHeads()[0] || myStack.getTorsos()[0] || myStack.getLegs()[0];
    const fromPile = myStack.getHeads().length > 0 ? BodyPart.Head : 
                    myStack.getTorsos().length > 0 ? BodyPart.Torso : BodyPart.Legs;
    
    testPlayer1.moveCard({
      cardId: cardToMove.id,
      fromStackId: myStack.getId(),
      fromPile: fromPile,
      toStackId: opponentStack.getId(),
      toPile: BodyPart.Head
    });
    
    // After move, should return to PLAY_CARD state because last card was wild
    expect(testPlayer1.getState().getState()).toBe(PlayerStateType.PLAY_CARD);
    expect(testPlayer1.isMyTurn()).toBe(true);
    
    // Should NOT be opponent's turn
    expect(testPlayer2.getState().getState()).toBe(PlayerStateType.WAITING_FOR_OPPONENT);
  });
});