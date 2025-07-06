import React from 'react';
import { Character, BodyPart } from '@npzr/core';
import './WildCardNomination.css';

interface WildCardNominationProps {
  isOpen: boolean;
  cardName: string;
  onNominate: (character: Character, bodyPart: BodyPart) => void;
  onCancel: () => void;
}

/**
 * Modal dialog for wild card nomination
 */
export const WildCardNomination: React.FC<WildCardNominationProps> = ({
  isOpen,
  cardName,
  onNominate,
  onCancel
}) => {
  const [selectedCharacter, setSelectedCharacter] = React.useState<Character | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = React.useState<BodyPart | null>(null);

  const characters = [
    { value: Character.Ninja, label: 'Ninja', icon: '🥷' },
    { value: Character.Pirate, label: 'Pirate', icon: '🏴‍☠️' },
    { value: Character.Zombie, label: 'Zombie', icon: '🧟' },
    { value: Character.Robot, label: 'Robot', icon: '🤖' },
  ];

  const bodyParts = [
    { value: BodyPart.Head, label: 'Head', icon: '🗣️' },
    { value: BodyPart.Torso, label: 'Torso', icon: '👕' },
    { value: BodyPart.Legs, label: 'Legs', icon: '👖' },
  ];

  const handleNominate = () => {
    if (selectedCharacter !== null && selectedBodyPart !== null) {
      onNominate(selectedCharacter, selectedBodyPart);
      // Reset selections
      setSelectedCharacter(null);
      setSelectedBodyPart(null);
    }
  };

  const handleCancel = () => {
    onCancel();
    // Reset selections
    setSelectedCharacter(null);
    setSelectedBodyPart(null);
  };

  React.useEffect(() => {
    if (isOpen) {
      // Reset selections when modal opens
      setSelectedCharacter(null);
      setSelectedBodyPart(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="wild-card-nomination-overlay" data-testid="wild-card-nomination">
      <div className="wild-card-nomination-modal">
        <h2>Nominate Wild Card</h2>
        <p>Choose character and body part for: <strong>{cardName}</strong></p>
        
        <div className="nomination-section">
          <h3>Character</h3>
          <div className="character-options">
            {characters.map((character) => (
              <button
                key={character.value}
                className={`character-option ${selectedCharacter === character.value ? 'selected' : ''}`}
                onClick={() => setSelectedCharacter(character.value)}
                data-testid={`character-${character.label.toLowerCase()}`}
              >
                <span className="character-icon">{character.icon}</span>
                <span className="character-label">{character.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="nomination-section">
          <h3>Body Part</h3>
          <div className="body-part-options">
            {bodyParts.map((bodyPart) => (
              <button
                key={bodyPart.value}
                className={`body-part-option ${selectedBodyPart === bodyPart.value ? 'selected' : ''}`}
                onClick={() => setSelectedBodyPart(bodyPart.value)}
                data-testid={`body-part-${bodyPart.label.toLowerCase()}`}
              >
                <span className="body-part-icon">{bodyPart.icon}</span>
                <span className="body-part-label">{bodyPart.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="nomination-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            data-testid="cancel-nomination"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNominate}
            disabled={selectedCharacter === null || selectedBodyPart === null}
            data-testid="confirm-nomination"
          >
            Nominate
          </button>
        </div>
      </div>
    </div>
  );
};