import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button, { IButtonProps } from '@/components/ui/Button';

type Props = {
  fullName: string;
  onSubmit: () => void;
  saveButton: {
    text: string;
    color: IButtonProps['color'];
    disabled: boolean;
  };
};

const ProfileHeader = ({ fullName, onSubmit, saveButton }: Props) => {
  return (
    <Subheader>
      <SubheaderLeft>
        {fullName}{' '}
        <Badge  variant='outline' rounded='rounded-full' className='border-transparent'>
          Editar Usuario
        </Badge>
      </SubheaderLeft>
      <SubheaderRight>
        <Button
          icon='HeroServer'
          variant='solid'
          color={saveButton.color}
          isDisable={saveButton.disabled}
          onClick={onSubmit}>
          {saveButton.text}
        </Button>
      </SubheaderRight>
    </Subheader>
  );
};

export default ProfileHeader;
