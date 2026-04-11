import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useNavigation } from '../../contexts/NavigationContext';
import { useApplication } from '../../contexts/ApplicationContext';

const linkSx = {
    fontSize: '12px',
    minWidth: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textTransform: 'none',
    lineHeight: 'normal',
    p: 0,
    '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
};

export default function PanelBreadcrumb( {
    label = null,
    navigable = false,
    disabled = false,
    showAppLink = true,
} ) {
    const { __ } = wp.i18n || {};
    const { panel, navigateGuarded } = useNavigation();
    const { selectedApplication, selectedApplicationId } = useApplication();

    const appLink = showAppLink && selectedApplication && selectedApplicationId;

    if ( ! appLink && ! label ) return null;

    return (
        <Stack direction="row" alignItems="center" gap="2px">
            { appLink && (
                <Button
                    disabled={ disabled }
                    variant="text"
                    color="primary"
                    onClick={ () => navigateGuarded( 'applications', selectedApplicationId ) }
                    sx={ { ...linkSx, cursor: disabled ? 'default' : 'pointer' } }
                >
                    { selectedApplication.title || __( 'Applications', 'rest-api-firewall' ) }
                </Button>
            ) }
            { appLink && label && (
                <Typography variant="caption" sx={ { lineHeight: 'normal' } }>/</Typography>
            ) }
            { label && (
                navigable ? (
                    <Button
                        disabled={ disabled }
                        variant="text"
                        onClick={ () => navigateGuarded( panel ) }
                        sx={ { ...linkSx, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' } }
                    >
                        { label }
                    </Button>
                ) : (
                    <Typography
                        sx={ {
                            color: 'text.secondary',
                            fontSize: '12px',
                            display: 'block',
                            lineHeight: 'normal',
                            fontWeight: 600,
                        } }
                    >
                        { label }
                    </Typography>
                )
            ) }
        </Stack>
    );
}
