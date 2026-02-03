import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';

import Schemas from './Schemas';
import SchemasPro from './SchemasPro';
import Collections from './Collections';
import Card from '@mui/material/Card';

export default function Models( { form, setField, postTypes } ) {
	return (
		<Stack spacing={ 3 }>
			<Grid container spacing={ 4 } py={ 3 }>
				<Grid size={ { xs: 12, md: 6 } } spacing={ 4 }>
					<Stack spacing={ 3 }>
						<Card variant="outlined" sx={ { px: 2, py: 3 } }>
							<Collections
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						</Card>
						<Card variant="outlined" sx={ { px: 2, py: 3 } }>
							<Schemas
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						</Card>
					</Stack>
				</Grid>
				<Grid size={ { xs: 12, md: 6 } }>
					<SchemasPro
						form={ form }
						setField={ setField }
						postTypes={ postTypes }
					/>
				</Grid>
			</Grid>
		</Stack>
	);
}
