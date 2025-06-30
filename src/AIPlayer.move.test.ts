import { AIPlayer } from './AIPlayer.js';
import { Player } from './Player.js';
import { GameEngine } from './GameEngine.js';
import { Card, Character, BodyPart } from './Card.js';
import { Stack } from './Stack.js';
import { PlayerState } from './PlayerState.js';

describe('AIPlayer Move Functionality', () => {
  let gameEngine: GameEngine;
  let player: Player;
  let aiPlayer: AIPlayer;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.createGame();
    player = gameEngine.addPlayer('AI Player');
    aiPlayer = new AIPlayer(player, 'medium');
  });

  describe('Strategic Move Selection', () => {
    test('should prioritize completion moves when possible', () => {
      // Set up a scenario where AI can complete a stack
      const stack1 = new Stack('stack1', player.getId());
      const stack2 = new Stack('stack2', player.getId());

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs = new Card('card3', Character.Ninja, BodyPart.Legs);

      // Stack1 almost complete (missing legs)
      stack1.addCard(ninjaHead, BodyPart.Head);
      stack1.addCard(ninjaTorso, BodyPart.Torso);

      // Stack2 has the completing piece
      stack2.addCard(ninjaLegs, BodyPart.Legs);

      // Mock the game engine to return our test stacks
      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      // Set player to move card state
      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Execute the move
      aiPlayer.makeMove();

      // Should have logged a completion move
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Moving ninja legs')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('completion')
      );

      consoleSpy.mockRestore();
    });

    test('should execute disruption moves by stealing opponent pieces', () => {
      const ownStack = new Stack('stack1', player.getId());
      const opponentStack = new Stack('stack2', 'opponent');

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const valuablePiece = new Card('card2', Character.Pirate, BodyPart.Head);

      ownStack.addCard(ninjaHead, BodyPart.Head);
      opponentStack.addCard(valuablePiece, BodyPart.Head);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([ownStack]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([opponentStack]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      aiPlayer.makeMove();

      // Should have logged a disruption move
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Moving pirate head')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('disruption')
      );

      consoleSpy.mockRestore();
    });

    test('should create new stacks when beneficial for organization', () => {
      const mixedStack = new Stack('stack1', player.getId());

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      // Stack with mixed characters - should separate
      mixedStack.addCard(ninjaHead, BodyPart.Head);
      mixedStack.addCard(pirateTorso, BodyPart.Torso);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([mixedStack]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      aiPlayer.makeMove();

      // Should have logged a move to new stack
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('to new stack')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('organization')
      );

      consoleSpy.mockRestore();
    });

    test('should handle cascade opportunities', () => {
      const stack1 = new Stack('stack1', player.getId());
      const stack2 = new Stack('stack2', player.getId());
      const stack3 = new Stack('stack3', player.getId());

      // Create a cascade scenario
      const ninjaHead1 = new Card('card1', Character.Ninja, BodyPart.Head);
      const ninjaTorso1 = new Card('card2', Character.Ninja, BodyPart.Torso);
      const ninjaLegs1 = new Card('card3', Character.Ninja, BodyPart.Legs);

      const pirateHead = new Card('card4', Character.Pirate, BodyPart.Head);
      const pirateTorso = new Card('card5', Character.Pirate, BodyPart.Torso);

      // Stack1: Almost complete ninja
      stack1.addCard(ninjaHead1, BodyPart.Head);
      stack1.addCard(ninjaTorso1, BodyPart.Torso);

      // Stack2: Has legs and partial pirate
      stack2.addCard(ninjaLegs1, BodyPart.Legs);
      stack2.addCard(pirateHead, BodyPart.Head);

      // Stack3: More pirate pieces
      stack3.addCard(pirateTorso, BodyPart.Torso);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2, stack3]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      aiPlayer.makeMove();

      // Should have logged a cascade move
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('cascade')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Move Execution Integration', () => {
    test('should call player.moveCard with correct MoveOptions', () => {
      const stack1 = new Stack('stack1', player.getId());
      const stack2 = new Stack('stack2', player.getId());

      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      stack1.addCard(ninjaHead, BodyPart.Head);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();

      player.setState(PlayerState.moveCard());

      aiPlayer.makeMove();

      expect(moveCardSpy).toHaveBeenCalledWith({
        cardId: expect.any(String),
        fromStackId: expect.any(String),
        fromPile: expect.any(String),
        toStackId: expect.any(String),
        toPile: expect.any(String)
      });

      moveCardSpy.mockRestore();
    });

    test('should handle new stack creation in move options', () => {
      const stack = new Stack('stack1', player.getId());
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      // Mixed stack that should be separated
      stack.addCard(ninjaHead, BodyPart.Head);
      stack.addCard(pirateTorso, BodyPart.Torso);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();

      player.setState(PlayerState.moveCard());

      aiPlayer.makeMove();

      // Should call moveCard with undefined toStackId for new stack creation
      const lastCall = moveCardSpy.mock.calls[moveCardSpy.mock.calls.length - 1];
      const moveOptions = lastCall[0];

      expect(moveOptions.toStackId).toBeUndefined();

      moveCardSpy.mockRestore();
    });

    test('should handle no valid moves gracefully', () => {
      // Empty stacks - no moves possible
      jest.spyOn(player, 'getMyStacks').mockReturnValue([]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      aiPlayer.makeMove();

      expect(consoleSpy).toHaveBeenCalledWith('AI: No strategic moves found');

      consoleSpy.mockRestore();
    });
  });

  describe('Wild Card Move Handling', () => {
    test('should handle moving wild cards and clear nominations', () => {
      const stack1 = new Stack('stack1', player.getId());
      const stack2 = new Stack('stack2', player.getId());

      const wildCard = new Card('card1', Character.Wild, BodyPart.Wild);
      wildCard.nominate(Character.Ninja, BodyPart.Head);

      stack1.addCard(wildCard, BodyPart.Head);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack1, stack2]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      aiPlayer.makeMove();

      // Should handle wild card moves
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('wild')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    test('should only make moves when in MOVE_CARD state', () => {
      const stack = new Stack('stack1', player.getId());
      const card = new Card('card1', Character.Ninja, BodyPart.Head);
      stack.addCard(card, BodyPart.Head);

      jest.spyOn(player, 'getMyStacks').mockReturnValue([stack]);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      const moveCardSpy = jest.spyOn(player, 'moveCard').mockImplementation();

      // Not in move card state
      player.setState(PlayerState.waitingForOpponent());

      aiPlayer.makeMove();

      expect(moveCardSpy).not.toHaveBeenCalled();

      moveCardSpy.mockRestore();
    });

    test('should handle NOMINATE_WILD state error', () => {
      player.setState(PlayerState.nominateWild());

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      aiPlayer.makeMove();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NOMINATE_WILD state reached - this indicates an implementation error')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Move Strategy by Game Phase', () => {
    test('should adapt strategy based on game progress', () => {
      // Early game: focus on organization
      const earlyStacks = [new Stack('stack1', player.getId())];
      const ninjaHead = new Card('card1', Character.Ninja, BodyPart.Head);
      const pirateTorso = new Card('card2', Character.Pirate, BodyPart.Torso);

      earlyStacks[0].addCard(ninjaHead, BodyPart.Head);
      earlyStacks[0].addCard(pirateTorso, BodyPart.Torso);

      jest.spyOn(player, 'getMyStacks').mockReturnValue(earlyStacks);
      jest.spyOn(player, 'getOpponentStacks').mockReturnValue([]);

      player.setState(PlayerState.moveCard());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      aiPlayer.makeMove();

      // Should focus on organization in early game
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('organization')
      );

      consoleSpy.mockRestore();
    });
  });
});