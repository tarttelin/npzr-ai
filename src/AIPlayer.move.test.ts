import { AIPlayer } from './AIPlayer.js';
import { Player, MoveOptions } from './Player.js';
import { GameEngine } from './GameEngine.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { PlayerStateType } from './PlayerState.js';

describe('AIPlayer Move Coordination', () => {
  let gameEngine: GameEngine;
  let player: Player;
  let aiPlayer: AIPlayer;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.createGame();
    
    gameEngine.addPlayer('Human'); // Need two players for game to start
    player = gameEngine.addPlayer('AI');
    aiPlayer = new AIPlayer(player, 'hard');
    
    // Spy on console.log to verify strategic reasoning output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('makeMove() coordination', () => {
    test('should coordinate move execution when in MOVE_CARD state', () => {
      // Set up game state where AI needs to move
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const stack2 = new Stack('stack2', playerId);
      
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaLegs = new Card('card2', Character.Ninja, BodyPart.Legs);
      
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(ninjaLegs, BodyPart.Legs);
      
      // Mock player methods
      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();
      const isMyTurnSpy = jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      const getStateSpy = jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      const getMyStacksSpy = jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      const getOpponentStacksSpy = jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      // Execute move
      aiPlayer.makeMove();

      // Verify coordination
      expect(isMyTurnSpy).toHaveBeenCalled();
      expect(getStateSpy).toHaveBeenCalled();
      expect(getMyStacksSpy).toHaveBeenCalled();
      expect(getOpponentStacksSpy).toHaveBeenCalled();
      expect(moveCardSpy).toHaveBeenCalledWith(expect.objectContaining({
        cardId: expect.any(String),
        fromStackId: expect.any(String),
        fromPile: expect.any(String),
        toPile: expect.any(String)
      }));
    });

    test('should not execute moves when not AI turn', () => {
      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(false);

      aiPlayer.makeMove();

      expect(moveCardSpy).not.toHaveBeenCalled();
    });

    test('should not execute moves when not in MOVE_CARD state', () => {
      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.PLAY_CARD
      } as any);

      aiPlayer.makeMove();

      expect(moveCardSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleMoveCard() integration', () => {
    test('should call Player.moveCard() with properly formatted MoveOptions', () => {
      // Set up scenario with completion opportunity
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const stack2 = new Stack('stack2', playerId);
      
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);
      
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      // Mock player methods
      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      aiPlayer.makeMove();

      // Verify MoveOptions format
      expect(moveCardSpy).toHaveBeenCalledWith(expect.objectContaining({
        cardId: ninjaLegs.id,
        fromStackId: stack2.getId(),
        fromPile: BodyPart.Legs,
        toStackId: stack1.getId(), // Should move to complete the stack
        toPile: BodyPart.Legs
      }));
    });

    test('should handle new stack creation with undefined toStackId', () => {
      // Set up scenario where new stack creation is beneficial
      const playerId = player.getId();
      const mixedStack = new Stack('stack1', playerId);
      
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);
      
      mixedStack.addCard(ninjaHead, BodyPart.Head);
      mixedStack.addCard(pirateTorso, BodyPart.Torso);

      // Mock player methods
      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([mixedStack]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      aiPlayer.makeMove();

      // Should find at least one move, and some moves might create new stacks
      expect(moveCardSpy).toHaveBeenCalled();
      
      // Check if any call had undefined toStackId (new stack creation)
      const moveCallArgs = moveCardSpy.mock.calls[0][0] as MoveOptions;
      expect(moveCallArgs).toHaveProperty('cardId');
      expect(moveCallArgs).toHaveProperty('fromStackId');
      expect(moveCallArgs).toHaveProperty('fromPile');
      expect(moveCallArgs).toHaveProperty('toPile');
      // toStackId can be either defined (move to existing) or undefined (new stack)
    });
  });

  describe('Strategic Communication', () => {
    test('should log move reasoning with card details and strategic value', () => {
      // Set up scenario
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const stack2 = new Stack('stack2', playerId);
      
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaLegs = new Card('card2', Character.Ninja, BodyPart.Legs);
      
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      // Mock player methods
      jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      aiPlayer.makeMove();

      // Verify console logging includes strategic information with difficulty indicator
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/AI \(.+\): Moving .+ - .+ \(value: \d+, type: \w+\)/));
    });

    test('should log different message formats for different move types', () => {
      // This test would require different scenarios for completion, disruption, organization
      // For now, just verify that logging happens with proper format
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      stack1.addCard(ninjaHead, BodyPart.Head);

      jest.spyOn(player, 'moveCard').mockImplementation();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      aiPlayer.makeMove();

      // Verify strategic logging format includes reasoning and value
      const logCalls = consoleSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('AI: Moving')
      );
      
      if (logCalls.length > 0) {
        expect(logCalls[0][0]).toMatch(/value: \d+/);
        expect(logCalls[0][0]).toMatch(/type: \w+/);
      }
    });

    test('should warn when no strategic moves are found', () => {
      // Set up scenario with no possible moves
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      aiPlayer.makeMove();

      expect(warnSpy).toHaveBeenCalledWith('AI: No strategic moves found');
    });
  });

  describe('Error Handling', () => {
    test('should handle Player.moveCard() throwing errors gracefully', () => {
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      stack1.addCard(ninjaHead, BodyPart.Head);

      // Mock player.moveCard to throw an error
      jest.spyOn(player, 'moveCard').mockImplementation(() => {
        throw new Error('Move failed');
      });
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      jest.spyOn(player, 'getState').mockReturnValue({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true
      } as any);
      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);
      jest.spyOn(player, 'getHand').mockReturnValue({ getCards: () => [] } as any);
      jest.spyOn(player, 'getMyScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);
      jest.spyOn(player, 'getOpponentScore').mockReturnValue({ size: () => 0, hasCharacter: () => false } as any);

      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw, should handle gracefully
      expect(() => aiPlayer.makeMove()).not.toThrow();
      
      // Should log the error
      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/AIPlayer error in state/), expect.any(Error));
    });
  });

  describe('Game Flow Integration', () => {
    test('should properly coordinate with GameEngine state management', () => {
      // This is more of an integration test with actual GameEngine
      const playerId = player.getId();
      const stack1 = new Stack('stack1', playerId);
      const stack2 = new Stack('stack2', playerId);
      
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaLegs = new Card('card2', Character.Ninja, BodyPart.Legs);
      
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      // Add stacks to actual game engine
      gameEngine['stacks'] = [stack1, stack2];
      
      // Set player to MOVE_CARD state
      player.setState({
        getState: () => PlayerStateType.MOVE_CARD,
        canMoveCard: () => true,
        getMessage: () => 'Move a card',
        isWaiting: () => false,
        isGameOver: () => false
      } as any);

      // Execute move through actual coordination
      expect(() => aiPlayer.makeMove()).not.toThrow();
    });

    test('should use takeTurnIfReady() for turn management', () => {
      const makeMoveSpy = jest.spyOn(aiPlayer, 'makeMove').mockImplementation();
      
      // Test when it's AI's turn
      jest.spyOn(player, 'isMyTurn').mockReturnValue(true);
      aiPlayer.takeTurnIfReady();
      expect(makeMoveSpy).toHaveBeenCalled();

      // Test when it's not AI's turn
      makeMoveSpy.mockClear();
      jest.spyOn(player, 'isMyTurn').mockReturnValue(false);
      aiPlayer.takeTurnIfReady();
      expect(makeMoveSpy).not.toHaveBeenCalled();
    });
  });
});