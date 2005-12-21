dojo.kwCompoundRequire({
	common: [
		"orp.uuid.factory",
		"orp.uuid.Uuid",
		"orp.uuid.RandomUuid",
		"orp.uuid.TimeBasedUuid"
	]
});
dojo.hostenv.moduleLoaded("orp.uuid.*");

