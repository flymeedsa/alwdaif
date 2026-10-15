<?php
// Disposable loopback-only test runtime. Never a production configuration.
return ['site_url'=>'http://127.0.0.1:22861','host'=>'127.0.0.1','port'=>33317,'database'=>'alwdaif_readiness','username'=>'root','password'=>'readiness-local-only','token'=>'readiness-signing-fixture-key','auth_state_dir'=>__DIR__.'/auth-state'];
