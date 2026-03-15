import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

export default function GlobalSecurity( { form, setField } ) {
	const { __ } = wp.i18n || {};

	return (
		<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>

			<Stack flex={ 1 } spacing={ 3 }>
                <Typography
                    variant="subtitle1"
                    fontWeight={ 600 }
                    sx={ { mb: 2 } }
                >
                    { __( 'WordPress Security', 'rest-api-firewall' ) }
                </Typography>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! form.theme_disable_xmlrpc }
								name="theme_disable_xmlrpc"
								onChange={ setField }
								
							/>
						}
						label={ __(
							'Disable XML-RPC endpoint',
							'rest-api-firewall'
						) }
					/>
				</FormControl>

				<FormControl>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ !! form.theme_disable_filedit }
								name="theme_disable_filedit"
								onChange={ setField }
							/>
						}
						label={ __(
							'Disable theme file editor',
							'rest-api-firewall'
						) }
					/>
				</FormControl>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_disable_comments }
                                name="theme_disable_comments"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Disable Comments',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Deactivate comments site wide',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_disable_pingbacks }
                                name="theme_disable_pingbacks"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Disable Pingbacks',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Deactivate pingbacks site wide',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

                 <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_disable_rss }
                                name="theme_disable_rss"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Disable RSS feeds',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Disable all RSS/Atom feeds.',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

                 <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_disable_sitemap }
                                name="theme_disable_sitemap"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Disable XML Sitemap',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Disable the built-in XML sitemap functionality',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

                 <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_disable_pingbacks }
                                name="theme_disable_pingbacks"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Enforce Cookie Protection Headers',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Enforce secure HTTP headers for cookie protection',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_enforce_wpconfig_permissions }
                                name="theme_enforce_wpconfig_permissions"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Secure wp-config.php file',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Write 400 or 440 file permissions on wp-config.php',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>
               
                <FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={ !! form.theme_secure_uploads_dir }
                                name="theme_secure_uploads_dir"
                                onChange={ setField }
                            />
                        }
                        label={ __(
                            'Protect Uploads Directory',
                            'rest-api-firewall'
                        ) }
                    />
                    <FormHelperText>
                        { __(
                            'Protect the uploads directory from file execution and directory listing.',
                            'rest-api-firewall'
                        ) }
                    </FormHelperText>
                </FormControl>

            </Stack>
    
		</Stack>
	);
}
