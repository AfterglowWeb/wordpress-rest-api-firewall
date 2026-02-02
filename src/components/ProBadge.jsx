import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PendingIcon from '@mui/icons-material/Pending';

export default function ProBadge ( { position } ) {

    const { __ } = wp.i18n || {};

   const badgePosition = () => {
        const xoffset = 70;
        const yoffset = 5;
        const positions = {
            'top':         { top: -yoffset, left: '50%', transform: 'translateX(-50%)' },
            'bottom':      { bottom: -yoffset, left: '50%', transform: 'translateX(-50%)' },
            'left':        { left: -xoffset, top: '50%', transform: 'translateY(-50%)' },
            'right':       { right: 0, top: '50%', transform: 'translateY(-50%)' },
            'top-right':   { top: -yoffset, right: -yoffset },
            'top-left':    { top: -yoffset, left: -yoffset },
            'bottom-right': { bottom: -yoffset, right: -yoffset },
            'bottom-left': { bottom: -15, left: -yoffset },
        };
        return positions[position] || positions['top-right'];
    }

    return (
    <Box sx={ { position: 'absolute', ...badgePosition() } }>			
        <Box
            sx={ {
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                color: '#999999',
            } }
        >
            <PendingIcon sx={ { fontSize: '16px' } } />
            <Typography variant="caption" sx={ { fontSize: '11px', fontWeight: 500 } }>
                {__('PRO', 'rest-api-firewall') }
            </Typography>
        </Box>
    </Box>
    );
}