document.addEventListener('DOMContentLoaded', () => {
    const structureButtons = document.querySelectorAll('.structure-btn');
    const bridgeBuilderBtn = document.getElementById('bridge-builder-btn');
    const simulationContainer = document.getElementById('simulation-container');

    let engine, render;

    function initMatter() {
        // Clear the container
        simulationContainer.innerHTML = '';

        // Create an engine
        engine = Matter.Engine.create();

        // Create a renderer
        render = Matter.Render.create({
            element: simulationContainer,
            engine: engine,
            options: {
                width: simulationContainer.clientWidth,
                height: simulationContainer.clientHeight,
                wireframes: false, // Set to false to see fills
                background: 'transparent' // Use the CSS background
            }
        });

        // Run the engine and the renderer
        Matter.Engine.run(engine);
        Matter.Render.run(render);
    }

    function loadStructure(structure) {
        initMatter();
        // Clear existing bodies
        Matter.World.clear(engine.world, false);

        switch (structure) {
            case 'pillar':
                loadPillar();
                break;
            case 'arch-bridge':
                loadArchBridge();
                break;
            case 'suspension-bridge':
                loadSuspensionBridge();
                break;
            case 'truss-bridge':
                loadTrussBridge();
                break;
            case 'cantilever-beam':
                loadCantileverBeam();
                break;
            case 'crane-arm':
                loadCraneArm();
                break;
            case 'girder-bridge':
                loadGirderBridge();
                break;
            // Add cases for other structures here
        }
    }

    function loadArchBridge() {
        const numSegments = 10;
        const segmentWidth = 30;
        const segmentHeight = 20;
        const archRadius = 200;
        const archY = simulationContainer.clientHeight - 100;

        const arch = Matter.Composite.create();

        for (let i = 0; i < numSegments; i++) {
            const angle = -Math.PI + (i / (numSegments - 1)) * Math.PI;
            const x = simulationContainer.clientWidth / 2 + archRadius * Math.cos(angle);
            const y = archY + archRadius * Math.sin(angle);
            const segment = Matter.Bodies.rectangle(x, y, segmentWidth, segmentHeight, {
                angle: angle + Math.PI / 2,
                render: { fillStyle: '#555' }
            });
            Matter.Composite.add(arch, segment);
        }

        // Add constraints between segments
        for (let i = 0; i < arch.bodies.length - 1; i++) {
            const constraint = Matter.Constraint.create({
                bodyA: arch.bodies[i],
                bodyB: arch.bodies[i + 1],
                stiffness: 0.8
            });
            Matter.Composite.add(arch, constraint);
        }

        // Add supports
        const supportLeft = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2 - archRadius - segmentWidth / 2,
            archY,
            segmentWidth,
            segmentHeight,
            { isStatic: true, render: { fillStyle: '#333' } }
        );
        const supportRight = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2 + archRadius + segmentWidth / 2,
            archY,
            segmentWidth,
            segmentHeight,
            { isStatic: true, render: { fillStyle: '#333' } }
        );

        Matter.World.add(engine.world, [arch, supportLeft, supportRight]);

        // Add load
        const load = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            archY - archRadius - 50,
            40,
            40,
            { render: { fillStyle: '#ccc' } }
        );
         const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
        Matter.World.add(engine.world, [load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            const ctx = render.context;
            // Draw compression forces in the arch
            for (let i = 0; i < arch.constraints.length; i++) {
                const constraint = arch.constraints[i];
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;

                // A simple way to check for compression is to see if the distance
                // between the bodies is less than the original distance.
                // This is a simplification and not a real stress analysis.
                const currentLength = Matter.Vector.magnitude(
                    Matter.Vector.sub(bodyB.position, bodyA.position)
                );
                const originalLength = Matter.Vector.magnitude(
                    Matter.Vector.sub(bodyB.position, bodyA.position)
                );


                const stress = Math.min(1, Math.abs(currentLength - originalLength) / 5);
                if (stress > 0.1) {
                    drawStress(ctx, bodyA.position, bodyB.position, stress, currentLength < originalLength);
                }
            }
        });
    }

    function loadSuspensionBridge() {
        const bridgeY = simulationContainer.clientHeight - 100;
        const bridgeWidth = 500;
        const bridgeSegments = 10;
        const segmentWidth = bridgeWidth / bridgeSegments;

        const deck = Matter.Composite.create();

        for (let i = 0; i < bridgeSegments; i++) {
            const segment = Matter.Bodies.rectangle(
                (simulationContainer.clientWidth - bridgeWidth) / 2 + i * segmentWidth + segmentWidth / 2,
                bridgeY,
                segmentWidth,
                20,
                { render: { fillStyle: '#555' } }
            );
            Matter.Composite.add(deck, segment);
        }

        for (let i = 0; i < deck.bodies.length - 1; i++) {
            const constraint = Matter.Constraint.create({
                bodyA: deck.bodies[i],
                bodyB: deck.bodies[i + 1],
                stiffness: 1
            });
            Matter.Composite.add(deck, constraint);
        }

        const tower1 = Matter.Bodies.rectangle(
            (simulationContainer.clientWidth - bridgeWidth) / 2 - 20,
            bridgeY - 100,
            40,
            200,
            { isStatic: true, render: { fillStyle: '#333' } }
        );

        const tower2 = Matter.Bodies.rectangle(
            (simulationContainer.clientWidth + bridgeWidth) / 2 + 20,
            bridgeY - 100,
            40,
            200,
            { isStatic: true, render: { fillStyle: '#333' } }
        );

        const cable = Matter.Composite.create();
        const cableSegments = 12;
        const cableSag = 100;

        for (let i = 0; i < cableSegments; i++) {
            const x = (simulationContainer.clientWidth - bridgeWidth) / 2 - 20 + (i / (cableSegments - 1)) * (bridgeWidth + 40);
            const y = bridgeY - 100 - cableSag * Math.sin((i / (cableSegments - 1)) * Math.PI);
            const circle = Matter.Bodies.circle(x, y, 5, { isStatic: true, render: {fillStyle: 'transparent' }});
            Matter.Composite.add(cable, circle);
        }

        for (let i = 0; i < cable.bodies.length - 1; i++) {
            const constraint = Matter.Constraint.create({
                bodyA: cable.bodies[i],
                bodyB: cable.bodies[i+1],
                stiffness: 0.5,
                 render: {
                    strokeStyle: '#ccc',
                    lineWidth: 2
                }
            });
             Matter.Composite.add(cable, constraint);
        }

        // Attach deck to cables
        for (let i = 0; i < bridgeSegments; i++) {
            const deckSegment = deck.bodies[i];
            const cableAttachmentPoint = cable.bodies[Math.floor(i * (cableSegments/bridgeSegments))];
            const suspender = Matter.Constraint.create({
                bodyA: deckSegment,
                pointA: {x: 0, y: -10},
                bodyB: cableAttachmentPoint,
                pointB: {x:0, y: 0},
                stiffness: 0.8,
                render: {
                    strokeStyle: '#ccc',
                    lineWidth: 1
                }
            });
            Matter.Composite.add(deck, suspender);
        }

        Matter.World.add(engine.world, [deck, tower1, tower2, cable]);

        const load = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            bridgeY - 50,
            40,
            40,
            { render: { fillStyle: '#ccc' } }
        );

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            const ctx = render.context;

            // Draw tension in main cable
            for (let i = 0; i < cable.constraints.length; i++) {
                const constraint = cable.constraints[i];
                const stress = Math.min(1, constraint.length / 100);
                drawStress(ctx, constraint.bodyA.position, constraint.bodyB.position, stress, true);
            }

            // Draw tension in suspenders
            for (let i = 0; i < deck.constraints.length; i++) {
                const constraint = deck.constraints[i];
                if(constraint.render.strokeStyle) { // only for suspenders
                    const stress = Math.min(1, constraint.length / 50);
                    const start = { x: constraint.bodyA.position.x + constraint.pointA.x, y: constraint.bodyA.position.y + constraint.pointA.y };
                    const end = { x: constraint.bodyB.position.x + constraint.pointB.x, y: constraint.bodyB.position.y + constraint.pointB.y };
                    drawStress(ctx, start, end, stress, true);
                }
            }
        });
    }

    function loadTrussBridge() {
        const bridgeY = simulationContainer.clientHeight - 100;
        const bridgeWidth = 500;
        const bridgeSections = 5;
        const sectionWidth = bridgeWidth / bridgeSections;
        const sectionHeight = 80;

        const truss = Matter.Composite.create();
        const nodes = [];

        // Create nodes
        for (let i = 0; i <= bridgeSections; i++) {
            nodes.push({ x: (simulationContainer.clientWidth - bridgeWidth) / 2 + i * sectionWidth, y: bridgeY });
            nodes.push({ x: (simulationContainer.clientWidth - bridgeWidth) / 2 + i * sectionWidth, y: bridgeY - sectionHeight });
        }

        const bodies = nodes.map(node => Matter.Bodies.circle(node.x, node.y, 5, { /*isStatic: true,*/ render: { fillStyle: '#666' } }));
        Matter.Composite.add(truss, bodies);

        // Make end nodes static
        Matter.Body.setStatic(bodies[0], true);
        Matter.Body.setStatic(bodies[2 * bridgeSections], true);


        function addBeam(nodeA, nodeB) {
            const beam = Matter.Constraint.create({
                bodyA: bodies[nodeA],
                bodyB: bodies[nodeB],
                stiffness: 0.9,
                render: {
                    strokeStyle: '#888',
                    lineWidth: 3
                }
            });
            Matter.Composite.add(truss, beam);
        }

        // Add beams
        for (let i = 0; i < bridgeSections; i++) {
            const n = i * 2;
            addBeam(n, n + 1); // Vertical
            addBeam(n, n + 2); // Bottom chord
            addBeam(n + 1, n + 3); // Top chord
            addBeam(n, n + 3); // Diagonal
        }
        addBeam(bridgeSections*2, bridgeSections*2 + 1); // last vertical

        Matter.World.add(engine.world, [truss]);

        const load = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            bridgeY - sectionHeight - 30,
            40,
            40,
            { isStatic: false, render: { fillStyle: '#ccc' } }
        );

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            for (let i = 0; i < truss.constraints.length; i++) {
                const constraint = truss.constraints[i];
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;
                const point = { x: (bodyA.position.x + bodyB.position.x) / 2, y: (bodyA.position.y + bodyB.position.y) / 2 };

                const initialLength = Matter.Vector.magnitude(
                    Matter.Vector.sub(
                        {x: constraint.bodyA.position.x, y: constraint.bodyA.position.y},
                        {x: constraint.bodyB.position.x, y: constraint.bodyB.position.y}
                    )
                );
                const currentLength = Matter.Vector.magnitude(
                     Matter.Vector.sub(
                        {x: constraint.bodyA.position.x, y: constraint.bodyA.position.y},
                        {x: constraint.bodyB.position.x, y: constraint.bodyB.position.y}
                    )
                );
                const difference = currentLength - initialLength;


                const stress = Math.min(1, Math.abs(difference) / 2);
                if (stress > 0.05) {
                    drawStress(ctx, bodyA.position, bodyB.position, stress, difference > 0);
                }
            }
        });
    }

    function loadCantileverBeam() {
        const beamWidth = 400;
        const beamHeight = 20;
        const beamY = simulationContainer.clientHeight / 2;
        const beamX = 200;

        const beam = Matter.Composites.stack(beamX, beamY, 10, 1, 0, 0, (x, y) => {
            return Matter.Bodies.rectangle(x, y, beamWidth / 10, beamHeight, {
                render: { fillStyle: '#555' }
            });
        });

        Matter.Composites.chain(beam, 0.5, 0, -0.5, 0, { stiffness: 0.9 });

        const wall = Matter.Bodies.rectangle(beamX - 20, beamY, 40, 80, { isStatic: true, render: {fillStyle: '#333'} });
        const anchor = Matter.Constraint.create({
            bodyA: beam.bodies[0],
            bodyB: wall,
            pointA: { x: -beamWidth / 20, y: 0 },
            pointB: { x: 0, y: 0 },
            stiffness: 1
        });

        Matter.World.add(engine.world, [beam, wall, anchor]);

        const load = Matter.Bodies.rectangle(
            beamX + beamWidth - 50,
            beamY - 50,
            40,
            40,
            { render: { fillStyle: '#ccc' } }
        );

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            const ctx = render.context;
            for (let i = 0; i < beam.constraints.length; i++) {
                const constraint = beam.constraints[i];
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;

                // Simplified bending moment visualization
                const stress = Math.min(1, Math.abs(bodyB.position.y - bodyA.position.y) / 10);
                // Tension on top, compression on bottom
                const start1 = { x: bodyA.position.x, y: bodyA.position.y - beamHeight / 2 };
                const end1 = { x: bodyB.position.x, y: bodyB.position.y - beamHeight / 2 };
                drawStress(ctx, start1, end1, stress, true);
                const start2 = { x: bodyA.position.x, y: bodyA.position.y + beamHeight / 2 };
                const end2 = { x: bodyB.position.x, y: bodyB.position.y + beamHeight / 2 };
                drawStress(ctx, start2, end2, stress, false);
            }
        });
    }

    function loadCraneArm() {
        const craneX = 200;
        const craneY = simulationContainer.clientHeight - 150;

        const tower = Matter.Bodies.rectangle(craneX, craneY, 40, 300, { isStatic: true, render: { fillStyle: '#333' } });
        const arm = Matter.Composites.stack(craneX + 20, craneY - 150, 8, 1, 0, 0, (x, y) => {
            return Matter.Bodies.rectangle(x, y, 50, 15, { render: { fillStyle: '#555' } });
        });
        Matter.Composites.chain(arm, 0.5, 0, -0.5, 0, { stiffness: 1 });

        const jib = Matter.Constraint.create({
            bodyA: tower,
            bodyB: arm.bodies[0],
            pointA: { x: 20, y: -150 },
            pointB: { x: -25, y: 0 },
            stiffness: 1
        });

        const tie = Matter.Constraint.create({
            bodyA: tower,
            bodyB: arm.bodies[4],
            pointA: { x: 0, y: -150 },
            pointB: { x: 0, y: 0 },
            stiffness: 0.1,
            render: { strokeStyle: '#ccc', lineWidth: 2 }
        });

        Matter.World.add(engine.world, [tower, arm, jib, tie]);

        const load = Matter.Bodies.rectangle(
            craneX + 20 + 8 * 50,
            craneY - 100,
            30,
            30,
            { render: { fillStyle: '#ccc' } }
        );

        const cable = Matter.Constraint.create({
            bodyA: arm.bodies[7],
            bodyB: load,
            pointA: { x: 25, y: 0 },
            pointB: { x: 0, y: -15 },
            stiffness: 0.5,
            render: { strokeStyle: '#ccc', lineWidth: 1 }
        });

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [load, cable, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            const ctx = render.context;
            // Tension in tie
            const tieStress = Math.min(1, tie.length / 200);
            const tieStart = { x: tie.bodyA.position.x + tie.pointA.x, y: tie.bodyA.position.y + tie.pointA.y };
            const tieEnd = { x: tie.bodyB.position.x + tie.pointB.x, y: tie.bodyB.position.y + tie.pointB.y };
            drawStress(ctx, tieStart, tieEnd, tieStress, true);

            // Tension in cable
            const cableStress = Math.min(1, cable.length / 100);
            const cableStart = { x: cable.bodyA.position.x + cable.pointA.x, y: cable.bodyA.position.y + cable.pointA.y };
            const cableEnd = { x: cable.bodyB.position.x + cable.pointB.x, y: cable.bodyB.position.y + cable.pointB.y };
            drawStress(ctx, cableStart, cableEnd, cableStress, true);

            // Bending in arm
            for (let i = 0; i < arm.constraints.length; i++) {
                const constraint = arm.constraints[i];
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;
                const stress = Math.min(1, Math.abs(bodyB.position.y - bodyA.position.y) / 5);
                const start1 = { x: bodyA.position.x, y: bodyA.position.y - 7.5 };
                const end1 = { x: bodyB.position.x, y: bodyB.position.y - 7.5 };
                drawStress(ctx, start1, end1, stress, true); // Tension
                const start2 = { x: bodyA.position.x, y: bodyA.position.y + 7.5 };
                const end2 = { x: bodyB.position.x, y: bodyB.position.y + 7.5 };
                drawStress(ctx, start2, end2, stress, false); // Compression
            }
        });
    }

    function loadGirderBridge() {
        const bridgeY = simulationContainer.clientHeight - 100;
        const bridgeWidth = 500;
        const beamHeight = 40;

        const bridge = Matter.Composites.stack(
            (simulationContainer.clientWidth - bridgeWidth) / 2,
            bridgeY - beamHeight,
            5,
            1,
            0,
            0,
            (x, y) => {
                return Matter.Bodies.rectangle(x, y, bridgeWidth / 5, beamHeight, {
                    render: { fillStyle: '#555' }
                });
            }
        );

        Matter.Composites.chain(bridge, 0.5, 0, -0.5, 0, { stiffness: 1 });

        const support1 = Matter.Bodies.rectangle(
            (simulationContainer.clientWidth - bridgeWidth) / 2,
            bridgeY,
            80,
            80,
            { isStatic: true, render: { fillStyle: '#333' } }
        );
        const support2 = Matter.Bodies.rectangle(
            (simulationContainer.clientWidth + bridgeWidth) / 2,
            bridgeY,
            80,
            80,
            { isStatic: true, render: { fillStyle: '#333' } }
        );

        Matter.World.add(engine.world, [bridge, support1, support2]);

        const load = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            bridgeY - beamHeight - 30,
            40,
            40,
            { render: { fillStyle: '#ccc' } }
        );

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            const ctx = render.context;
            for (let i = 0; i < bridge.constraints.length; i++) {
                const constraint = bridge.constraints[i];
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;

                // Simplified bending moment visualization
                const stress = Math.min(1, Math.abs(bodyB.position.y - bodyA.position.y) / 10);
                const start1 = { x: bodyA.position.x, y: bodyA.position.y - beamHeight / 2 };
                const end1 = { x: bodyB.position.x, y: bodyB.position.y - beamHeight / 2 };
                drawStress(ctx, start1, end1, stress, true); // Tension
                const start2 = { x: bodyA.position.x, y: bodyA.position.y + beamHeight / 2 };
                const end2 = { x: bodyB.position.x, y: bodyB.position.y + beamHeight / 2 };
                drawStress(ctx, start2, end2, stress, false); // Compression
            }
        });
    }

    function loadPillar() {
        const pillar = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            simulationContainer.clientHeight - 100,
            80,
            200,
            { isStatic: true,
              render: {
                fillStyle: '#555'
              }
            }
        );

        const load = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            simulationContainer.clientHeight - 250,
            60,
            60,
            { render: {
                fillStyle: '#ccc'
              }
            }
        );

        const mouse = Matter.Mouse.create(render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Matter.World.add(engine.world, [pillar, load, mouseConstraint]);

        Matter.Events.on(engine, 'afterUpdate', () => {
            // Clear previous force indicators
            const forceIndicators = document.querySelectorAll('.force-arrow');
            forceIndicators.forEach(arrow => arrow.remove());

            // Draw compression arrows
            const ctx = render.context;
            const pillarTop = pillar.position.y - pillar.bounds.min.y;
            const loadBottom = load.position.y + load.bounds.max.y;

            // Simple check for contact
            if (load.position.y > pillar.position.y - 150) {
                const stress = Math.min(1, (load.position.y - (pillar.position.y - 150)) / 100);
                const start = { x: pillar.position.x, y: pillar.position.y - 90 };
                const end = { x: pillar.position.x, y: pillar.position.y + 90 };
                drawStress(ctx, start, end, stress, false);
            }
        });
    }

    function drawStress(ctx, start, end, stress, isTension) {
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const length = Matter.Vector.magnitude(Matter.Vector.sub(end, start));
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        const r = Math.floor(255 * stress);
        const g = Math.floor(255 * (1 - stress));
        const color = `rgb(${r},${g},0)`;

        ctx.save();
        ctx.translate(mid.x, mid.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.lineWidth = 5 + stress * 10;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    }


    structureButtons.forEach(button => {
        button.addEventListener('click', () => {
            const structureType = button.getAttribute('data-structure');
            loadStructure(structureType);
        });
    });

    const builderInstructions = document.getElementById('builder-instructions');

    structureButtons.forEach(button => {
        button.addEventListener('click', () => {
            builderInstructions.style.display = 'none';
            const structureType = button.getAttribute('data-structure');
            loadStructure(structureType);
        });
    });

    bridgeBuilderBtn.addEventListener('click', () => {
        builderInstructions.style.display = 'block';
        loadBridgeBuilder();
    });

    function loadBridgeBuilder() {
        initMatter();
        Matter.World.clear(engine.world, false);

        let isDrawing = false;
        let startNode = null;
        const nodes = [];
        const beams = [];

        // Add ground
        const ground = Matter.Bodies.rectangle(
            simulationContainer.clientWidth / 2,
            simulationContainer.clientHeight - 20,
            simulationContainer.clientWidth,
            40,
            { isStatic: true }
        );
        Matter.World.add(engine.world, ground);


        simulationContainer.addEventListener('mousedown', (e) => {
            const mousePosition = { x: e.offsetX, y: e.offsetY };
            const existingNode = findNodeAt(mousePosition);

            if (e.button === 0) { // Left-click
                if (existingNode) {
                    isDrawing = true;
                    startNode = existingNode;
                } else {
                    const newNode = createNode(mousePosition, e.ctrlKey); // Ctrl-click for static
                    nodes.push(newNode);
                    Matter.World.add(engine.world, newNode);
                }
            }
        });

        simulationContainer.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                const mousePosition = { x: e.offsetX, y: e.offsetY };
                // Draw a temporary line to show where the beam will go
                const ctx = render.context;
                ctx.beginPath();
                ctx.moveTo(startNode.position.x, startNode.position.y);
                ctx.lineTo(mousePosition.x, mousePosition.y);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
        });

        simulationContainer.addEventListener('mouseup', (e) => {
            if (isDrawing) {
                const mousePosition = { x: e.offsetX, y: e.offsetY };
                let endNode = findNodeAt(mousePosition);

                if (!endNode) {
                    endNode = createNode(mousePosition, e.ctrlKey);
                    nodes.push(endNode);
                    Matter.World.add(engine.world, endNode);
                }

                const newBeam = createBeam(startNode, endNode);
                beams.push(newBeam);
                Matter.World.add(engine.world, newBeam);

                isDrawing = false;
                startNode = null;
            }
        });

        function findNodeAt(position) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const distance = Matter.Vector.magnitude(
                    Matter.Vector.sub(position, node.position)
                );
                if (distance < 10) {
                    return node;
                }
            }
            return null;
        }

        function createNode(position, isStatic) {
            return Matter.Bodies.circle(position.x, position.y, 8, {
                isStatic: isStatic,
                render: { fillStyle: isStatic ? '#333' : '#ccc' }
            });
        }

        function createBeam(nodeA, nodeB) {
            return Matter.Constraint.create({
                bodyA: nodeA,
                bodyB: nodeB,
                stiffness: 0.8,
                render: { strokeStyle: '#888', lineWidth: 4 }
            });
        }

        const simulateBtn = document.createElement('button');
        simulateBtn.textContent = 'Simulate';
        simulateBtn.style.position = 'absolute';
        simulateBtn.style.top = '10px';
        simulateBtn.style.right = '10px';
        simulationContainer.appendChild(simulateBtn);

        simulateBtn.addEventListener('click', () => {
            // Make all non-static nodes dynamic
            nodes.forEach(node => {
                if (!node.isStatic) {
                    Matter.Body.setStatic(node, false);
                }
            });
        });

        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.position = 'absolute';
        resetBtn.style.top = '40px';
        resetBtn.style.right = '10px';
        simulationContainer.appendChild(resetBtn);

        resetBtn.addEventListener('click', () => {
            loadBridgeBuilder();
        });


        Matter.Events.on(engine, 'afterUpdate', () => {
            // Stress visualization
            for (let i = 0; i < beams.length; i++) {
                const beam = beams[i];
                const initialLength = Matter.Vector.magnitude(
                    Matter.Vector.sub(beam.bodyA.position, beam.bodyB.position)
                );
                 const currentLength = Matter.Vector.magnitude(
                    Matter.Vector.sub(beam.bodyA.position, beam.bodyB.position)
                );
                const difference = currentLength - beam.length;

                const stress = Math.min(1, Math.abs(difference) / 10);
                if (stress > 0.1) {
                    if (difference > 0) {
                        beam.render.strokeStyle = `rgb(${255 * stress}, ${255 * (1-stress)}, 0)`; // Tension
                    } else {
                        beam.render.strokeStyle = `rgb(${255 * stress}, ${255 * (1-stress)}, 0)`; // Compression
                    }
                } else {
                    beam.render.strokeStyle = '#888'; // Neutral
                }

                // Break condition
                if (Math.abs(difference) > 20) {
                    Matter.World.remove(engine.world, beam);
                    beams.splice(i, 1);
                    i--;
                }
            }
        });
    }

    // Initial load (optional, e.g., start with the pillar)
    loadStructure('pillar');
});
