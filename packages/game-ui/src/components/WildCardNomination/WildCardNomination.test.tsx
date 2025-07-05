import { render, screen, fireEvent } from '@testing-library/react';
import { Character, BodyPart } from '@npzr/core';
import { WildCardNomination } from './WildCardNomination';

describe('WildCardNomination', () => {
  const mockOnNominate = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    isOpen: true,
    cardName: 'Test Wild Card',
    onNominate: mockOnNominate,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    expect(screen.getByTestId('wild-card-nomination')).toBeInTheDocument();
    expect(screen.getByText('Nominate Wild Card')).toBeInTheDocument();
    expect(screen.getByText(/Test Wild Card/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<WildCardNomination {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('wild-card-nomination')).not.toBeInTheDocument();
  });

  it('renders all character options', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    expect(screen.getByTestId('character-ninja')).toBeInTheDocument();
    expect(screen.getByTestId('character-pirate')).toBeInTheDocument();
    expect(screen.getByTestId('character-zombie')).toBeInTheDocument();
    expect(screen.getByTestId('character-robot')).toBeInTheDocument();
  });

  it('renders all body part options', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    expect(screen.getByTestId('body-part-head')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-torso')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-legs')).toBeInTheDocument();
  });

  it('allows selecting character and body part', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    const ninjaButton = screen.getByTestId('character-ninja');
    const headButton = screen.getByTestId('body-part-head');
    
    fireEvent.click(ninjaButton);
    expect(ninjaButton).toHaveClass('selected');
    
    fireEvent.click(headButton);
    expect(headButton).toHaveClass('selected');
  });

  it('enables nominate button when both character and body part are selected', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    const nominateButton = screen.getByTestId('confirm-nomination');
    expect(nominateButton).toBeDisabled();
    
    fireEvent.click(screen.getByTestId('character-ninja'));
    expect(nominateButton).toBeDisabled();
    
    fireEvent.click(screen.getByTestId('body-part-head'));
    expect(nominateButton).not.toBeDisabled();
  });

  it('calls onNominate with selected values when nominate button is clicked', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('character-pirate'));
    fireEvent.click(screen.getByTestId('body-part-torso'));
    fireEvent.click(screen.getByTestId('confirm-nomination'));
    
    expect(mockOnNominate).toHaveBeenCalledWith(Character.Pirate, BodyPart.Torso);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('cancel-nomination'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('resets selections when modal opens', () => {
    const { rerender } = render(<WildCardNomination {...defaultProps} isOpen={false} />);
    
    rerender(<WildCardNomination {...defaultProps} isOpen={true} />);
    
    // No selections should be active
    expect(screen.getByTestId('character-ninja')).not.toHaveClass('selected');
    expect(screen.getByTestId('body-part-head')).not.toHaveClass('selected');
    expect(screen.getByTestId('confirm-nomination')).toBeDisabled();
  });

  it('resets selections after nomination', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('character-robot'));
    fireEvent.click(screen.getByTestId('body-part-legs'));
    fireEvent.click(screen.getByTestId('confirm-nomination'));
    
    // Selections should be reset
    expect(screen.getByTestId('character-robot')).not.toHaveClass('selected');
    expect(screen.getByTestId('body-part-legs')).not.toHaveClass('selected');
  });

  it('resets selections after cancel', () => {
    render(<WildCardNomination {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('character-zombie'));
    fireEvent.click(screen.getByTestId('body-part-head'));
    fireEvent.click(screen.getByTestId('cancel-nomination'));
    
    // Selections should be reset
    expect(screen.getByTestId('character-zombie')).not.toHaveClass('selected');
    expect(screen.getByTestId('body-part-head')).not.toHaveClass('selected');
  });
});